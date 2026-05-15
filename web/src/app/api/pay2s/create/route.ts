import { NextResponse } from "next/server";

import { createPay2sPayment } from "@/features/ecommerce/server/pay2s.service";
import {
  getOrderByIdOrNumberForUser,
  getOrderByIdForUser,
  getPaymentById,
} from "@/features/ecommerce/server/service";
import { requireAppUser } from "@/lib/auth";
import { getPay2sConfig } from "@/lib/pay2s";
import { getSiteUrlFromRequest } from "@/lib/seo";
import { getSystemSettings } from "@/lib/system-settings";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireAppUser();
  const body = (await request.json().catch(() => null)) as
    | { orderId?: string; paymentId?: string; amount?: number }
    | null;
  const orderKey = String(body?.orderId ?? "").trim();
  const paymentId = String(body?.paymentId ?? "").trim();

  let order = orderKey ? await getOrderByIdOrNumberForUser(user.id, orderKey) : null;
  let payment = paymentId ? await getPaymentById(paymentId) : null;

  if (payment && !order) {
    order = await getOrderByIdForUser(user.id, payment.orderId);
  }
  if (!payment && order) {
    payment = order.payments.find((item) => item.provider === "pay2s" && item.status === "pending") ?? null;
  }

  if (!order || !payment || payment.provider !== "pay2s") {
    return NextResponse.json({ error: "order_not_found", message: "Không tìm thấy đơn Pay2S hợp lệ." }, { status: 404 });
  }

  if (typeof body?.amount === "number" && Math.round(body.amount) !== Math.round(payment.amount)) {
    return NextResponse.json({ error: "invalid_amount", message: "Số tiền thanh toán không khớp." }, { status: 400 });
  }

  const settings = await getSystemSettings();
  const method = settings.ecommerce.paymentMethods.find(
    (item) => item.code === payment.method && item.provider === "pay2s"
  );
  const config = method ? getPay2sConfig(method) : null;

  if (!config) {
    return NextResponse.json({ error: "pay2s_not_configured", message: "Pay2S chưa được cấu hình." }, { status: 400 });
  }

  const result = await createPay2sPayment({
    order,
    payment,
    config,
    siteUrl: getSiteUrlFromRequest(request),
  });

  return NextResponse.json({
    paymentUrl: result.paymentUrl,
    orderId: payment.id,
  });
}
