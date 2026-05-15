import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAppUser } from "@/lib/auth";
import { adminUpdatePaymentState, getOrderByNumberForUser } from "@/features/ecommerce/server/service";
import type { EcommercePayment } from "@/features/ecommerce/types";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const formData = await request.formData();
  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  const action = String(formData.get("action") ?? "confirm").trim();

  if (!orderNumber) {
    return respondError(request, {
      error: "missing_order",
      message: "Thiếu mã đơn hàng.",
      location: ROUTES.CUSTOMER.ORDERS,
    });
  }

  const order = await getOrderByNumberForUser(user.id, orderNumber);

  if (!order) {
    return respondError(request, {
      error: "order_not_found",
      message: "Không tìm thấy đơn hàng.",
      location: ROUTES.CUSTOMER.ORDERS,
      status: 404,
    });
  }

  const payment = order.payments[0];

  if (!payment) {
    return respondError(request, {
      error: "payment_not_found",
      message: "Không tìm thấy payment của đơn hàng.",
      location: ROUTES.PAYMENT.ORDER(order.orderNumber),
    });
  }

  const status: EcommercePayment["status"] = action === "cancel" ? "failed" : "pending";
  const location =
    status === "failed"
      ? `${ROUTES.PAYMENT.FAILED}?orderNumber=${encodeURIComponent(order.orderNumber)}`
      : `${ROUTES.PAYMENT.SUCCESS}?orderNumber=${encodeURIComponent(order.orderNumber)}`;

  await adminUpdatePaymentState({
    paymentId: payment.id,
    status,
    externalRef: status === "pending" ? `customer-confirmed-${order.orderNumber}` : `customer-cancelled-${order.orderNumber}`,
  });

  return respondSuccess(request, {
    location,
    message: status === "pending" ? "Đã ghi nhận yêu cầu xác nhận thanh toán." : "Đã hủy thanh toán.",
  });
}
