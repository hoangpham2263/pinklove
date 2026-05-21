import { requireAdmin } from "@/lib/auth";
import { adminUpdateAffiliateAccount, getAffiliateAccountForUser } from "@/features/affiliate/server/service";
import { type AffiliateStatus } from "@/features/affiliate/types";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const formData = await request.formData();
  const bulkAction = String(formData.get("bulkAction") ?? "").trim() as AffiliateStatus;
  const userIds = formData
    .getAll("userIds")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (userIds.length === 0) {
    return respondError(request, {
      error: "missing_selection",
      message: "Hãy chọn ít nhất một tài khoản để áp dụng thao tác hàng loạt.",
      location: `${ROUTES.ADMIN.AFFILIATE_ACCOUNTS}?error=missing_selection`,
    });
  }

  if (!["pending", "active", "rejected", "blocked"].includes(bulkAction)) {
    return respondError(request, {
      error: "invalid_bulk_action",
      message: "Tác vụ hàng loạt không hợp lệ.",
      location: `${ROUTES.ADMIN.AFFILIATE_ACCOUNTS}?error=invalid_bulk_action`,
    });
  }

  try {
    for (const userId of userIds) {
      const account = await getAffiliateAccountForUser(userId);
      if (!account) {
        throw new Error("AFFILIATE_NOT_FOUND");
      }

      await adminUpdateAffiliateAccount({
        actorId: admin.id,
        userId,
        status: bulkAction,
        commissionType: account.commissionType,
        commissionValue: account.commissionValue,
        notes: account.notes,
      });
    }

    return respondSuccess(request, {
      location: ROUTES.ADMIN.AFFILIATE_ACCOUNTS,
      message: `Đã cập nhật ${userIds.length} tài khoản affiliate.`,
      data: { count: userIds.length, bulk: bulkAction },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "update_failed";
    const message =
      code === "AFFILIATE_NOT_FOUND"
        ? "Không tìm thấy tài khoản affiliate."
        : code === "AFFILIATE_STATUS_INVALID"
          ? "Trạng thái affiliate không hợp lệ."
          : code === "AFFILIATE_COMMISSION_TYPE_INVALID"
            ? "Loại commission không hợp lệ."
            : code === "AFFILIATE_COMMISSION_INVALID"
              ? "Mức commission không hợp lệ."
              : "Không thể cập nhật affiliate lúc này.";
    return respondError(request, {
      error: code,
      message,
      location: `${ROUTES.ADMIN.AFFILIATE_ACCOUNTS}?error=${encodeURIComponent(code)}`,
    });
  }
}
