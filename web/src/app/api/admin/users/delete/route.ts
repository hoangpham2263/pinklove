import { adminDeleteAccount, getCurrentUserFromRequest, isAdminRole } from"@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime ="nodejs";

export async function POST(request: Request) {
 const actor = await getCurrentUserFromRequest(request);
 if (!actor) {
 return respondError(request, { status: 401, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập admin.", location: ROUTES.ADMIN.LOGIN });
 }
 if (!isAdminRole(actor.role)) {
 return respondError(request, { status: 403, error: "FORBIDDEN", message: "Bạn không có quyền xóa người dùng.", location: ROUTES.CUSTOMER.DASHBOARD });
 }

 const formData = await request.formData();
 const userId = String(formData.get("userId") ??"").trim();
 const returnTo = String(formData.get("returnTo") ?? ROUTES.ADMIN.USERS).trim() || ROUTES.ADMIN.USERS;

 if (!userId) {
 return respondError(request, { error: "invalid_user", message: "Người dùng không hợp lệ.", location: `${returnTo}?error=invalid_user` });
 }

 try {
 await adminDeleteAccount(actor.id, userId);
 return respondSuccess(request, { location: returnTo, message: "Đã xóa tài khoản." });
 } catch (error) {
 const message = error instanceof Error ? error.message :"";
 if (message ==="USER_NOT_FOUND") {
  return respondError(request, { error: "user_not_found", message: "Không tìm thấy người dùng.", location: `${returnTo}?error=user_not_found` });
 }
 if (message ==="CANNOT_DELETE_SELF") {
  return respondError(request, { error: "cannot_delete_self", message: "Không thể tự xóa chính bạn.", location: `${returnTo}?error=cannot_delete_self` });
 }
 if (message ==="LAST_ADMIN_PROTECTED") {
  return respondError(request, { error: "last_admin_protected", message: "Không thể xóa quản trị viên cuối cùng.", location: `${returnTo}?error=last_admin_protected` });
 }
 return respondError(request, { error: "delete_failed", message: "Không thể xóa tài khoản.", location: `${returnTo}?error=delete_failed` });
 }
}
