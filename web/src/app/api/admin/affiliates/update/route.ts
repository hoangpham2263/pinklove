import { requireAdmin } from "@/lib/auth";
import {
  type AffiliateCommissionType,
  type AffiliateStatus,
} from "@/features/affiliate/types";
import { adminUpdateAffiliateAccount } from "@/features/affiliate/server/service";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const formData = await request.formData();
  const userId = String(formData.get("userId") ?? "").trim();
  const status = String(formData.get("status") ?? "pending") as AffiliateStatus;
  const commissionType = String(formData.get("commissionType") ?? "percent") as AffiliateCommissionType;
  const commissionValue = Number(formData.get("commissionValue") ?? "0");
  const notes = String(formData.get("notes") ?? "");

  if (!userId) {
    return respondError(request, {
      error: "missing_user",
      message: "Thiếu user cần cập nhật.",
      location: `${ROUTES.ADMIN.AFFILIATES}?error=missing_user`,
    });
  }

  try {
    await adminUpdateAffiliateAccount({
      actorId: admin.id,
      userId,
      status,
      commissionType,
      commissionValue,
      notes,
    });

    return respondSuccess(request, {
      location: ROUTES.ADMIN.AFFILIATES,
      message: "Đã cập nhật cấu hình affiliate.",
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "update_failed";
    const message =
      code === "AFFILIATE_NOT_FOUND"
        ? "Không tìm thấy tài khoản affiliate."
        : code === "AFFILIATE_COMMISSION_INVALID"
          ? "Mức commission không hợp lệ."
          : "Không thể cập nhật affiliate lúc này.";
    return respondError(request, {
      error: code,
      message,
      location: `${ROUTES.ADMIN.AFFILIATES}?error=${encodeURIComponent(code)}`,
    });
  }
}
