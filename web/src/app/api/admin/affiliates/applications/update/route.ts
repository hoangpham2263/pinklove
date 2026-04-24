import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { ROUTES } from "@/lib/routes";
import { adminUpdateAffiliateApplication } from "@/features/affiliate/server/service";
import { type AffiliateApplicationReviewStatus } from "@/features/affiliate/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();
  const formData = await request.formData();
  const applicationId = String(formData.get("applicationId") ?? "").trim();
  const status = String(formData.get("status") ?? "pending_review").trim() as AffiliateApplicationReviewStatus;
  const reviewNote = String(formData.get("reviewNote") ?? "");

  if (!applicationId) {
    return respondError(request, {
      error: "missing_application",
      message: "Thiếu hồ sơ affiliate cần cập nhật.",
      location: `${ROUTES.ADMIN.AFFILIATES}?error=missing_application`,
    });
  }

  try {
    await adminUpdateAffiliateApplication({
      applicationId,
      status,
      reviewNote,
    });

    return respondSuccess(request, {
      location: ROUTES.ADMIN.AFFILIATES,
      message: "Đã cập nhật hồ sơ affiliate.",
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "update_failed";
    const message =
      code === "AFFILIATE_APPLICATION_NOT_FOUND"
        ? "Không tìm thấy hồ sơ affiliate."
        : code === "AFFILIATE_APPLICATION_STATUS_INVALID"
          ? "Trạng thái hồ sơ affiliate không hợp lệ."
          : "Không thể cập nhật hồ sơ affiliate lúc này.";

    return respondError(request, {
      error: code,
      message,
      location: `${ROUTES.ADMIN.AFFILIATES}?error=${encodeURIComponent(code)}`,
    });
  }
}
