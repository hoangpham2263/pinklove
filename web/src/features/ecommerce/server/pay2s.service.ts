import "server-only";

import type { EcommerceOrder, EcommercePayment } from "@/features/ecommerce/types";
import { mergePaymentMetadata, recordPaymentLog } from "@/features/ecommerce/server/service";
import {
  extractPay2sPaymentUrl,
  generatePay2sCreateSignature,
  type Pay2sConfig,
  type Pay2sCreatePayload,
  type Pay2sCreateResponse,
} from "@/lib/pay2s";
import { ROUTES } from "@/lib/routes";

function buildPay2sOrderInfo(paymentId: string) {
  const sanitized = paymentId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 28);
  return `TT${sanitized}`.padEnd(10, "0");
}

function withSearchParam(url: string, params: Record<string, string>) {
  const nextUrl = new URL(url);
  Object.entries(params).forEach(([key, value]) => nextUrl.searchParams.set(key, value));
  return nextUrl.toString();
}

function resolvePay2sRedirectUrl(location: string | null, endpoint: string) {
  if (!location) return "";
  try {
    return new URL(location, endpoint).toString();
  } catch {
    return "";
  }
}

function redactCreatePayload(payload: Pay2sCreatePayload) {
  return {
    ...payload,
    accessKey: payload.accessKey ? "[configured]" : "",
    signature: payload.signature ? "[signed]" : "",
  };
}

export async function createPay2sPayment(input: {
  order: EcommerceOrder;
  payment: EcommercePayment;
  config: Pay2sConfig;
  siteUrl: string;
}) {
  const amount = Math.round(input.payment.amount);
  const requestId = `${Date.now()}`;
  const orderId = input.payment.id;
  const orderInfo = buildPay2sOrderInfo(input.payment.id);
  const redirectUrl = withSearchParam(`${input.siteUrl}${ROUTES.PAYMENT.SUCCESS}`, {
    orderNumber: input.order.orderNumber,
    paymentId: input.payment.id,
  });
  const ipnUrl = `${input.siteUrl}${ROUTES.API.PAY2S.IPN}`;
  const signature = generatePay2sCreateSignature({
    accessKey: input.config.accessKey,
    amount,
    ipnUrl,
    orderId,
    orderInfo,
    partnerCode: input.config.partnerCode,
    redirectUrl,
    requestId,
    requestType: input.config.requestType,
    secretKey: input.config.secretKey,
  });
  const payload: Pay2sCreatePayload = {
    accessKey: input.config.accessKey,
    partnerCode: input.config.partnerCode,
    requestId,
    amount,
    orderId,
    orderInfo,
    bankAccounts: input.config.bankAccounts,
    redirectUrl,
    ipnUrl,
    requestType: input.config.requestType,
    signature,
  };

  await recordPaymentLog({
    orderId: input.order.id,
    paymentId: input.payment.id,
    provider: "pay2s",
    type: "create",
    payload: { request: redactCreatePayload(payload) },
  });

  const response = await fetch(input.config.createEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(payload),
    cache: "no-store",
    redirect: "manual",
  });
  const responseText = await response.text();
  let responseBody: Pay2sCreateResponse;

  try {
    responseBody = JSON.parse(responseText) as Pay2sCreateResponse;
  } catch {
    responseBody = { message: responseText };
  }

  const redirectPaymentUrl = resolvePay2sRedirectUrl(response.headers.get("location"), input.config.createEndpoint);
  const paymentUrl = extractPay2sPaymentUrl(responseBody) || redirectPaymentUrl;

  await recordPaymentLog({
    orderId: input.order.id,
    paymentId: input.payment.id,
    provider: "pay2s",
    type: response.ok || paymentUrl ? "create" : "error",
    payload: { status: response.status, response: responseBody, location: redirectPaymentUrl || undefined },
  });
  await mergePaymentMetadata({
    paymentId: input.payment.id,
    metadata: {
      rawPaymentResponse: responseBody,
      pay2sRequestId: requestId,
      pay2sOrderInfo: orderInfo,
      pay2sPaymentUrl: paymentUrl || undefined,
    },
  });

  if (!paymentUrl) {
    throw new Error(String(responseBody.message || "PAY2S_CREATE_FAILED"));
  }

  return {
    paymentUrl,
    requestId,
    gatewayOrderId: orderId,
    response: responseBody,
  };
}
