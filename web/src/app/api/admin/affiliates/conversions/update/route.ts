import { requireAdmin } from "@/lib/auth";
import { adminUpdateAffiliateConversion } from "@/features/affiliate/server/service";
import { type AffiliateConversionStatus } from "@/features/affiliate/types";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();
  const formData = await request.formData();
  const conversionId = String(formData.get("conversionId") ?? "").trim();
  const status = String(formData.get("status") ?? "pending") as AffiliateConversionStatus;

  if (!conversionId) {
    return respondError(request, {
      error: "missing_conversion",
      message: "Thiếu conversion cần cập nhật.",
      location: `${ROUTES.ADMIN.AFFILIATE_CONVERSIONS}?error=missing_conversion`,
    });
  }

  try {
    await adminUpdateAffiliateConversion({ conversionId, status });
    return respondSuccess(request, {
      location: ROUTES.ADMIN.AFFILIATE_CONVERSIONS,
      message: "Đã cập nhật trạng thái conversion.",
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "update_failed";
    const message =
      code === "AFFILIATE_CONVERSION_NOT_FOUND"
        ? "Không tìm thấy conversion."
        : code === "AFFILIATE_CONVERSION_STATUS_INVALID"
          ? "Trạng thái conversion không hợp lệ."
          : "Không thể cập nhật conversion lúc này.";

    return respondError(request, {
      error: code,
      message,
      location: `${ROUTES.ADMIN.AFFILIATE_CONVERSIONS}?error=${encodeURIComponent(code)}`,
    });
  }
}
