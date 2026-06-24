import { adminCreateAccount, getCurrentUserFromRequest, isAdminRole, setUserProfile } from"@/lib/auth";
import { parseUserRole, type UserRole, USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/constants";
import { respondError, respondSuccess } from "@/lib/action-response";
import { assignAdminRole } from "@/features/access/server/service";

export const runtime ="nodejs";

export async function POST(request: Request) {
 const actor = await getCurrentUserFromRequest(request);
 if (!actor) {
 return respondError(request, { status: 401, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập admin.", location: ROUTES.ADMIN.LOGIN });
 }
 if (!isAdminRole(actor.role)) {
 return respondError(request, { status: 403, error: "FORBIDDEN", message: "Bạn không có quyền tạo tài khoản.", location: ROUTES.CUSTOMER.DASHBOARD });
 }

 const formData = await request.formData();
 const email = String(formData.get("email") ??"").trim().toLowerCase();
 const accountName = String(formData.get("accountName") ??"").trim();
 const password = String(formData.get("password") ??"");
 const accessRole = String(formData.get("accessRole") ?? `portal:${USER_ROLES.CUSTOMER}`).trim();
 const returnTo = String(formData.get("returnTo") ?? ROUTES.ADMIN.USERS).trim() || ROUTES.ADMIN.USERS;
 const adminRoleId = accessRole.startsWith("admin:") ? accessRole.slice(6).trim() : "";
 const role: UserRole = adminRoleId
  ? USER_ROLES.ADMIN
  : parseUserRole(accessRole.replace(/^portal:/, ""), USER_ROLES.CUSTOMER);
 const fullName = String(formData.get("fullName") ?? "").trim();
 const displayName = String(formData.get("displayName") ?? "").trim();
 const phone = String(formData.get("phone") ?? "").trim();
 const bio = String(formData.get("bio") ?? "").trim();

 if (!email || !accountName || !password) {
 return respondError(request, { error: "missing_fields", message: "Thiếu thông tin bắt buộc để tạo tài khoản.", location: `${returnTo}?error=missing_fields` });
 }
 if (password.length < MIN_PASSWORD_LENGTH) {
 return respondError(request, { error: "weak_password", message: "Mật khẩu quá ngắn.", location: `${returnTo}?error=weak_password` });
 }
 if (role === USER_ROLES.ADMIN && !adminRoleId) {
  return respondError(request, { error: "admin_role_required", message: "Vui lòng chọn vai trò Admin hoặc Staff.", location: `${returnTo}?error=admin_role_required` });
 }

 try {
 const created = await adminCreateAccount(email, accountName, password, role);
 if (role === USER_ROLES.ADMIN) {
  await assignAdminRole(created.id, adminRoleId, actor.id);
 }
 await setUserProfile(created.id, { fullName, displayName, phone, bio, avatarUrl: "" });
 return respondSuccess(request, { location: returnTo, message: "Đã tạo tài khoản mới." });
 } catch (error) {
 const message = error instanceof Error ? error.message :"";
 if (message.includes("users_email_normalized_uidx")) {
  return respondError(request, { error: "email_taken", message: "Email đã tồn tại.", location: `${returnTo}?error=email_taken` });
 }
 if (message.includes("user_profiles_phone_normalized_uidx")) {
  return respondError(request, { error: "phone_taken", message: "Số điện thoại đã tồn tại.", location: `${returnTo}?error=phone_taken` });
 }
 return respondError(request, { error: "create_failed", message: "Không thể tạo tài khoản.", location: `${returnTo}?error=create_failed` });
 }
}
