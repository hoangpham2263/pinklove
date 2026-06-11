import { updateProviderReviewStatus } from "@/features/providers/server/workspace";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();
  const formData = await request.formData();
  const reviewId = String(formData.get("reviewId") ?? "").trim();
  const status = String(formData.get("status") ?? "pending").trim();

  if (!reviewId) {
    return respondError(request, {
      error: "review_required",
      message: "Thiếu review cần cập nhật.",
      location: ROUTES.ADMIN.PROVIDER_REVIEWS,
    });
  }

  await updateProviderReviewStatus(reviewId, status);
  return respondSuccess(request, { location: ROUTES.ADMIN.PROVIDER_REVIEWS, message: "Đã cập nhật review." });
}
