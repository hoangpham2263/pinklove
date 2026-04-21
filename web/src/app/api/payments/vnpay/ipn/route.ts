import { NextResponse } from "next/server";

import { applyGatewayPaymentResult } from "@/features/ecommerce/server/service";
import {
  getVnpayConfig,
  getVnpayQueryParams,
  verifyVnpayParams,
} from "@/lib/vnpay";

export const runtime = "nodejs";

function vnpayResponse(RspCode: string, Message: string) {
  return NextResponse.json({ RspCode, Message });
}

export async function GET(request: Request) {
  const config = getVnpayConfig();
  if (!config) {
    return vnpayResponse("99", "VNPAY config is missing");
  }

  const params = getVnpayQueryParams(new URL(request.url));
  const paymentId = params.vnp_TxnRef;

  if (!verifyVnpayParams(params, config.hashSecret)) {
    return vnpayResponse("97", "Invalid signature");
  }

  if (!paymentId) {
    return vnpayResponse("01", "Order not found");
  }

  const result = await applyGatewayPaymentResult({
    paymentId,
    provider: "vnpay",
    amount: Number(params.vnp_Amount ?? 0) / 100,
    status: params.vnp_ResponseCode === "00" ? "paid" : "failed",
    externalRef: params.vnp_TransactionNo || params.vnp_BankTranNo || undefined,
  });

  if (!result.ok && result.reason === "not_found") {
    return vnpayResponse("01", "Order not found");
  }

  if (!result.ok && result.reason === "invalid_amount") {
    return vnpayResponse("04", "Invalid amount");
  }

  if (result.ok && result.alreadyProcessed) {
    return vnpayResponse("02", "Order already confirmed");
  }

  return vnpayResponse("00", "Confirm success");
}
