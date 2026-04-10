import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { adminUpdateShipmentState } from "@/features/commerce/server/service";
import type { ShipmentStatus } from "@/features/commerce/types";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();
  const formData = await request.formData();
  const orderId = String(formData.get("orderId") ?? "").trim();

  if (!orderId) {
    return respondError(request, {
      error: "missing_order",
      message: "Thiếu đơn hàng để cập nhật shipment.",
      location: ROUTES.ADMIN.SHIPMENTS,
    });
  }

  await adminUpdateShipmentState({
    orderId,
    status: String(formData.get("status") ?? "pending") as ShipmentStatus,
    carrier: String(formData.get("carrier") ?? ""),
    trackingNumber: String(formData.get("trackingNumber") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });

  return respondSuccess(request, {
    location: ROUTES.ADMIN.SHIPMENTS,
    message: "Đã cập nhật shipment.",
  });
}
