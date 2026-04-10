import { adminUpdateRole, getCurrentUserFromRequest, isAdminRole } from"@/lib/auth";
import { parseUserRole, type UserRole, USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime ="nodejs";

export async function POST(request: Request) {
 const actor = await getCurrentUserFromRequest(request);
 if (!actor) {
 return respondError(request, { status: 401, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập admin.", location: ROUTES.ADMIN.LOGIN });
 }
 if (!isAdminRole(actor.role)) {
 return respondError(request, { status: 403, error: "FORBIDDEN", message: "Bạn không có quyền cập nhật vai trò.", location: ROUTES.CUSTOMER.DASHBOARD });
 }

 const formData = await request.formData();
 const userIdRaw = String(formData.get("userId") ??"");
 const roleInput = String(formData.get("role") ?? USER_ROLES.CUSTOMER);
 const nextRole: UserRole = parseUserRole(roleInput, USER_ROLES.CUSTOMER);
 const userId = userIdRaw.trim();

 if (!userId) {
 return respondError(request, { error: "invalid_user", message: "Người dùng không hợp lệ.", location: `${ROUTES.ADMIN.USERS}?error=invalid_user` });
 }

 try {
 await adminUpdateRole(actor.id, userId, nextRole);
 return respondSuccess(request, { location: ROUTES.ADMIN.USERS, message: "Đã cập nhật vai trò." });
 } catch (error) {
 const message = error instanceof Error ? error.message :"";
 if (message ==="USER_NOT_FOUND") {
  return respondError(request, { error: "user_not_found", message: "Không tìm thấy người dùng.", location: `${ROUTES.ADMIN.USERS}?error=user_not_found` });
 }
 if (message ==="CANNOT_CHANGE_SELF_ROLE") {
  return respondError(request, { error: "cannot_change_self", message: "Không thể tự đổi vai trò của chính bạn.", location: `${ROUTES.ADMIN.USERS}?error=cannot_change_self` });
 }
 if (message ==="LAST_ADMIN_PROTECTED") {
  return respondError(request, { error: "last_admin_protected", message: "Không thể hạ quyền quản trị viên cuối cùng.", location: `${ROUTES.ADMIN.USERS}?error=last_admin_protected` });
 }
 return respondError(request, { error: "role_update_failed", message: "Không thể cập nhật vai trò.", location: `${ROUTES.ADMIN.USERS}?error=role_update_failed` });
 }
}
