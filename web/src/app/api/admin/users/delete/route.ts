import { adminDeleteAccount, getCurrentUserFromRequest } from"@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime ="nodejs";

export async function POST(request: Request) {
 const actor = await getCurrentUserFromRequest(request);
 if (!actor) {
 return respondError(request, { status: 401, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập admin.", location: ROUTES.ADMIN.LOGIN });
 }
 if (actor.role !=="admin") {
 return respondError(request, { status: 403, error: "FORBIDDEN", message: "Bạn không có quyền xóa người dùng.", location: ROUTES.USER.DASHBOARD });
 }

 const formData = await request.formData();
 const userId = String(formData.get("userId") ??"").trim();

 if (!userId) {
 return respondError(request, { error: "invalid_user", message: "Người dùng không hợp lệ.", location: `${ROUTES.ADMIN.USERS}?error=invalid_user` });
 }

 try {
 await adminDeleteAccount(actor.id, userId);
 return respondSuccess(request, { location: ROUTES.ADMIN.USERS, message: "Đã xóa tài khoản." });
 } catch (error) {
 const message = error instanceof Error ? error.message :"";
 if (message ==="USER_NOT_FOUND") {
  return respondError(request, { error: "user_not_found", message: "Không tìm thấy người dùng.", location: `${ROUTES.ADMIN.USERS}?error=user_not_found` });
 }
 if (message ==="CANNOT_DELETE_SELF") {
  return respondError(request, { error: "cannot_delete_self", message: "Không thể tự xóa chính bạn.", location: `${ROUTES.ADMIN.USERS}?error=cannot_delete_self` });
 }
 if (message ==="LAST_ADMIN_PROTECTED") {
  return respondError(request, { error: "last_admin_protected", message: "Không thể xóa admin cuối cùng.", location: `${ROUTES.ADMIN.USERS}?error=last_admin_protected` });
 }
 return respondError(request, { error: "delete_failed", message: "Không thể xóa tài khoản.", location: `${ROUTES.ADMIN.USERS}?error=delete_failed` });
 }
}
