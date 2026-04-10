import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { adminUpdatePaymentState } from "@/features/commerce/server/service";
import type { CommercePayment } from "@/features/commerce/types";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();
  const formData = await request.formData();
  const paymentId = String(formData.get("paymentId") ?? "").trim();

  if (!paymentId) {
    return respondError(request, {
      error: "missing_payment",
      message: "Thiếu payment cần cập nhật.",
      location: ROUTES.ADMIN.PAYMENTS,
    });
  }

  await adminUpdatePaymentState({
    paymentId,
    status: String(formData.get("status") ?? "pending") as CommercePayment["status"],
    externalRef: String(formData.get("externalRef") ?? ""),
  });

  return respondSuccess(request, {
    location: ROUTES.ADMIN.PAYMENTS,
    message: "Đã cập nhật payment.",
  });
}
