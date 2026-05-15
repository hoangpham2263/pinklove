import { NextResponse } from "next/server";

import {
  applyGatewayPaymentResult,
  getPaymentById,
  recordPaymentLog,
} from "@/features/ecommerce/server/service";
import { getPay2sConfig, getPay2sResultStatus, verifyPay2sIpnSignature, type Pay2sParams } from "@/lib/pay2s";
import { getSystemSettings } from "@/lib/system-settings";

export const runtime = "nodejs";

function pay2sResponse(success: boolean, message: string) {
  return NextResponse.json({ success, message }, { status: 200 });
}

async function readPayload(request: Request): Promise<Pay2sParams> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return ((await request.json().catch(() => ({}))) ?? {}) as Pay2sParams;
  }

  const text = await request.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text) as Pay2sParams;
  } catch {
    const params = new URLSearchParams(text);
    const payload: Pay2sParams = {};
    params.forEach((value, key) => {
      payload[key] = value;
    });
    return payload;
  }
}

export async function POST(request: Request) {
  const payload = await readPayload(request);
  const paymentId = String(payload.orderId ?? "").trim();

  if (!paymentId) {
    await recordPaymentLog({ provider: "pay2s", type: "error", payload: { reason: "missing_order_id", payload } });
    return pay2sResponse(false, "Order not found");
  }

  const [settings, payment] = await Promise.all([getSystemSettings(), getPaymentById(paymentId)]);
  const paymentMethod = payment
    ? settings.ecommerce.paymentMethods.find((method) => method.code === payment.method && method.provider === "pay2s")
    : null;
  const config = paymentMethod ? getPay2sConfig(paymentMethod) : null;

  await recordPaymentLog({
    orderId: payment?.orderId ?? null,
    paymentId,
    provider: "pay2s",
    type: "ipn",
    payload,
  });

  if (!payment || !config) {
    return pay2sResponse(false, "Order not found");
  }

  if (!verifyPay2sIpnSignature(payload, config.accessKey, config.secretKey)) {
    await recordPaymentLog({
      orderId: payment.orderId,
      paymentId,
      provider: "pay2s",
      type: "error",
      payload: { reason: "invalid_signature", payload },
    });
    return pay2sResponse(false, "ERROR! Fail checksum");
  }

  const result = await applyGatewayPaymentResult({
    paymentId,
    provider: "pay2s",
    amount: Number(payload.amount ?? 0),
    status: getPay2sResultStatus(payload.resultCode),
    externalRef: String(payload.transId || payload.requestId || "").trim() || undefined,
  });

  if (!result.ok && result.reason === "not_found") {
    return pay2sResponse(false, "Order not found");
  }

  if (!result.ok && result.reason === "invalid_amount") {
    return pay2sResponse(false, "Invalid amount");
  }

  return pay2sResponse(true, result.alreadyProcessed ? "Order already confirmed" : "Received payment result success");
}
