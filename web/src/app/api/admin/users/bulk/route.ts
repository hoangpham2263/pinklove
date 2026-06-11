import { adminDeleteAccount, adminUpdateRole, getCurrentUserFromRequest, isAdminRole } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";
import { parseUserRole, type UserRole, USER_ROLE_OPTIONS } from "@/lib/roles";
import { assignAdminRole } from "@/features/access/server/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const actor = await getCurrentUserFromRequest(request);
  if (!actor) {
    return respondError(request, { status: 401, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập admin.", location: ROUTES.ADMIN.LOGIN });
  }
  if (!isAdminRole(actor.role)) {
    return respondError(request, { status: 403, error: "FORBIDDEN", message: "Bạn không có quyền cập nhật hàng loạt người dùng.", location: ROUTES.CUSTOMER.DASHBOARD });
  }

  const formData = await request.formData();
  const bulkAction = String(formData.get("bulkAction") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? ROUTES.ADMIN.USERS).trim() || ROUTES.ADMIN.USERS;
  const userIds = formData
    .getAll("userIds")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (userIds.length === 0) {
    return respondError(request, { error: "missing_selection", message: "Hãy chọn ít nhất một người dùng.", location: `${returnTo}?error=missing_selection` });
  }

  const allowedBulkRoles = USER_ROLE_OPTIONS.filter((option) => option.value !== "ADMIN").map((option) => option.value);
  if (![...allowedBulkRoles, "delete"].includes(bulkAction)) {
    return respondError(request, { error: "invalid_bulk_action", message: "Tác vụ hàng loạt không hợp lệ.", location: `${returnTo}?error=invalid_bulk_action` });
  }

  try {
    if (bulkAction === "delete") {
      for (const userId of userIds) {
        await adminDeleteAccount(actor.id, userId);
      }
    } else {
      const nextRole: UserRole = parseUserRole(bulkAction);
      for (const userId of userIds) {
        await assignAdminRole(userId, null, actor.id);
        await adminUpdateRole(actor.id, userId, nextRole);
      }
    }

    return respondSuccess(request, { location: returnTo, message: "Đã áp dụng tác vụ hàng loạt." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "USER_NOT_FOUND") {
      return respondError(request, { error: "user_not_found", message: "Không tìm thấy người dùng.", location: `${returnTo}?error=user_not_found` });
    }
    if (message === "CANNOT_DELETE_SELF") {
      return respondError(request, { error: "cannot_delete_self", message: "Không thể tự xóa chính bạn.", location: `${returnTo}?error=cannot_delete_self` });
    }
    if (message === "CANNOT_CHANGE_SELF_ROLE") {
      return respondError(request, { error: "cannot_change_self", message: "Không thể tự đổi vai trò của chính bạn.", location: `${returnTo}?error=cannot_change_self` });
    }
    if (message === "LAST_ADMIN_PROTECTED") {
      return respondError(request, { error: "last_admin_protected", message: "Không thể sửa quản trị viên cuối cùng.", location: `${returnTo}?error=last_admin_protected` });
    }
    return respondError(request, { error: "bulk_failed", message: "Không thể áp dụng tác vụ hàng loạt.", location: `${returnTo}?error=bulk_failed` });
  }
}
