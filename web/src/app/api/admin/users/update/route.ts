import { adminUpdateAccount, getCurrentUserFromRequest, setUserProfile, type UserRole } from"@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime ="nodejs";

export async function POST(request: Request) {
 const actor = await getCurrentUserFromRequest(request);
 if (!actor) {
 return respondError(request, { status: 401, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập admin.", location: ROUTES.ADMIN.LOGIN });
 }
 if (actor.role !=="admin") {
 return respondError(request, { status: 403, error: "FORBIDDEN", message: "Bạn không có quyền cập nhật người dùng.", location: ROUTES.USER.DASHBOARD });
 }

 const formData = await request.formData();
 const userIdRaw = String(formData.get("userId") ??"");
 const username = String(formData.get("username") ??"").trim();
 const password = String(formData.get("password") ??"");
 const roleInput = String(formData.get("role") ??"");
 
 // Profile fields
 const fullName = String(formData.get("fullName") ??"").trim();
 const displayName = String(formData.get("displayName") ??"").trim();
 const phone = String(formData.get("phone") ??"").trim();
 const bio = String(formData.get("bio") ??"").trim();
 
 const userId = userIdRaw.trim();
 if (!userId) {
 return respondError(request, { error: "invalid_user", message: "Người dùng không hợp lệ.", location: `${ROUTES.ADMIN.USERS}?error=invalid_user` });
 }

 const data: { username?: string; password?: string; role?: UserRole } = {};
 if (username) data.username = username;
 if (password) data.password = password;
 if (roleInput ==="admin" || roleInput ==="user") data.role = roleInput as UserRole;

 try {
 // Update account basic info
 await adminUpdateAccount(actor.id, userId, data);
 
 // Update profile info
 await setUserProfile(userId, {
  fullName,
  displayName,
  phone,
  bio
 });
 
 return respondSuccess(request, { message: "Đã cập nhật tài khoản.", location: `${ROUTES.ADMIN.USERS}/${userId}` });
 } catch (error) {
 const message = error instanceof Error ? error.message :"";
 if (message ==="USER_NOT_FOUND") {
  return respondError(request, { error: "user_not_found", message: "Không tìm thấy người dùng.", location: `${ROUTES.ADMIN.USERS}?error=user_not_found` });
 }
 if (message ==="CANNOT_CHANGE_SELF_ROLE") {
  return respondError(request, { error: "cannot_change_self", message: "Không thể tự đổi vai trò của chính bạn.", location: `${ROUTES.ADMIN.USERS}/${userId}?error=cannot_change_self` });
 }
 if (message ==="LAST_ADMIN_PROTECTED") {
  return respondError(request, { error: "last_admin_protected", message: "Không thể hạ quyền admin cuối cùng.", location: `${ROUTES.ADMIN.USERS}/${userId}?error=last_admin_protected` });
 }
 return respondError(request, { error: "update_failed", message: "Không thể cập nhật người dùng.", location: `${ROUTES.ADMIN.USERS}/${userId}?error=update_failed` });
 }
}
