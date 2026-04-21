import { NextResponse } from "next/server";

import { applyGatewayPaymentResult, getOrderById } from "@/features/ecommerce/server/service";
import { ROUTES } from "@/lib/routes";
import { getSiteUrlFromRequest } from "@/lib/seo";
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
  const config = getVnpayConfig();
  if (!config) {
    return redirectTo(request, `${ROUTES.CUSTOMER.ORDERS}?payment=vnpay_not_configured`);
  }

  const url = new URL(request.url);
  const params = getVnpayQueryParams(url);
  const paymentId = params.vnp_TxnRef;

  if (!paymentId || !verifyVnpayParams(params, config.hashSecret)) {
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

  return redirectTo(request, `${ROUTES.CHECKOUT.SUCCESS(order.orderNumber)}?payment=vnpay`);
}
