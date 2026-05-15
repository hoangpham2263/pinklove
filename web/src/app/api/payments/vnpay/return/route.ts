import { NextResponse } from "next/server";

import { applyGatewayPaymentResult, getOrderById, getPaymentById } from "@/features/ecommerce/server/service";
import { ROUTES } from "@/lib/routes";
import { getSiteUrlFromRequest } from "@/lib/seo";
import { getSystemSettings } from "@/lib/system-settings";
import {
  getVnpayConfig,
  getVnpayQueryParams,
  verifyVnpayParams,
} from "@/lib/vnpay";

export const runtime = "nodejs";

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(`${getSiteUrlFromRequest(request)}${path}`, 303);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = getVnpayQueryParams(url);
  const paymentId = params.vnp_TxnRef;

  if (!paymentId) {
    return redirectTo(request, `${ROUTES.CUSTOMER.ORDERS}?payment=vnpay_order_not_found`);
  }

  const [settings, payment] = await Promise.all([getSystemSettings(), getPaymentById(paymentId)]);
  const paymentMethod = payment
    ? settings.ecommerce.paymentMethods.find((method) => method.code === payment.method && method.provider === "vnpay")
    : null;
  const config = paymentMethod ? getVnpayConfig(paymentMethod) : null;

  if (!config) {
    return redirectTo(request, `${ROUTES.CUSTOMER.ORDERS}?payment=vnpay_not_configured`);
  }

  if (!verifyVnpayParams(params, config.hashSecret)) {
    return redirectTo(request, `${ROUTES.CUSTOMER.ORDERS}?payment=vnpay_invalid_signature`);
  }

  const result = await applyGatewayPaymentResult({
    paymentId,
    provider: "vnpay",
    amount: Number(params.vnp_Amount ?? 0) / 100,
    status: params.vnp_ResponseCode === "00" ? "paid" : "failed",
    externalRef: params.vnp_TransactionNo || params.vnp_BankTranNo || undefined,
  });

  if (!result.ok) {
    return redirectTo(request, `${ROUTES.CUSTOMER.ORDERS}?payment=vnpay_${result.reason}`);
  }

  const order = await getOrderById(result.orderId);
  if (!order) {
    return redirectTo(request, `${ROUTES.CUSTOMER.ORDERS}?payment=vnpay_order_not_found`);
  }

  return redirectTo(
    request,
    params.vnp_ResponseCode === "00"
      ? `${ROUTES.PAYMENT.SUCCESS}?orderNumber=${encodeURIComponent(order.orderNumber)}&payment=vnpay`
      : `${ROUTES.PAYMENT.FAILED}?orderNumber=${encodeURIComponent(order.orderNumber)}&payment=vnpay`
  );
}
