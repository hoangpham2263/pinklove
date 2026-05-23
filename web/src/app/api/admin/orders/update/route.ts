import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { adminUpdateOrderState } from "@/features/ecommerce/server/service";
import { recordAdminOrderUpdateForProvider } from "@/features/provider-orders/server/service";
import type { FulfillmentStatus, OrderStatus, PaymentStatus } from "@/features/ecommerce/types";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const formData = await request.formData();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const status = String(formData.get("status") ?? "pending_payment") as OrderStatus;
  const paymentStatus = String(formData.get("paymentStatus") ?? "unpaid") as PaymentStatus;
  const fulfillmentStatus = String(formData.get("fulfillmentStatus") ?? "not_required") as FulfillmentStatus;
  const notes = String(formData.get("notes") ?? "");

  if (!orderId) {
    return respondError(request, {
      error: "missing_order",
      message: "Thiếu đơn hàng cần cập nhật.",
      location: ROUTES.ADMIN.ORDERS,
    });
  }

  await adminUpdateOrderState({
    orderId,
    status,
    paymentStatus,
    fulfillmentStatus,
    notes,
  });

  await recordAdminOrderUpdateForProvider({
    orderId,
    actorUserId: admin.id,
    status,
    paymentStatus,
    fulfillmentStatus,
  });

  return respondSuccess(request, {
    location: ROUTES.ADMIN.ORDER(orderId),
    message: "Đã cập nhật trạng thái đơn hàng.",
  });
}
