import { adminSetVendorAccountStatus, getCurrentUserFromRequest, isAdminRole, type AccountStatus } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

const ALLOWED_STATUSES = new Set<AccountStatus>(["active", "blocked", "banned", "deleted"]);

export async function POST(request: Request) {
  const actor = await getCurrentUserFromRequest(request);
  if (!actor) {
    return respondError(request, { status: 401, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập admin.", location: ROUTES.ADMIN.LOGIN });
  }
  if (!isAdminRole(actor.role)) {
    return respondError(request, { status: 403, error: "FORBIDDEN", message: "Bạn không có quyền quản lý supplier.", location: ROUTES.CUSTOMER.DASHBOARD });
  }

  const formData = await request.formData();
  const vendorId = String(formData.get("vendorId") ?? "").trim();
  const nextStatus = String(formData.get("nextStatus") ?? "").trim() as AccountStatus;
  const reason = String(formData.get("reason") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? ROUTES.ADMIN.VENDORS).trim() || ROUTES.ADMIN.VENDORS;

  if (!vendorId || !ALLOWED_STATUSES.has(nextStatus)) {
    return respondError(request, { error: "invalid_payload", message: "Dữ liệu cập nhật supplier không hợp lệ.", location: `${returnTo}?error=invalid_payload` });
  }

  try {
    await adminSetVendorAccountStatus(actor.id, vendorId, nextStatus, reason);
    return respondSuccess(request, { location: returnTo, message: "Đã cập nhật trạng thái supplier." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "USER_NOT_FOUND") {
      return respondError(request, { error: "user_not_found", message: "Không tìm thấy supplier.", location: `${returnTo}?error=user_not_found` });
    }
    if (message === "TARGET_NOT_VENDOR") {
      return respondError(request, { error: "target_not_vendor", message: "Tài khoản này không phải supplier.", location: `${returnTo}?error=target_not_vendor` });
    }
    return respondError(request, { error: "status_update_failed", message: "Không thể cập nhật trạng thái supplier.", location: `${returnTo}?error=status_update_failed` });
  }
}
