import { adminCreateAccount, getCurrentUserFromRequest, isAdminRole, setUserProfile } from"@/lib/auth";
import { parseUserRole, type UserRole, USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/constants";
import { respondError, respondSuccess } from "@/lib/action-response";

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
 const username = String(formData.get("username") ??"").trim();
 const password = String(formData.get("password") ??"");
 const roleInput = String(formData.get("role") ?? USER_ROLES.CUSTOMER);
 const returnTo = String(formData.get("returnTo") ?? ROUTES.ADMIN.USERS).trim() || ROUTES.ADMIN.USERS;
 const role: UserRole = parseUserRole(roleInput, USER_ROLES.CUSTOMER);
 const fullName = String(formData.get("fullName") ?? "").trim();
 const displayName = String(formData.get("displayName") ?? "").trim();
 const phone = String(formData.get("phone") ?? "").trim();
 const bio = String(formData.get("bio") ?? "").trim();

 if (!username || !password) {
 return respondError(request, { error: "missing_fields", message: "Thiếu thông tin bắt buộc để tạo tài khoản.", location: `${returnTo}?error=missing_fields` });
 }
 if (password.length < MIN_PASSWORD_LENGTH) {
 return respondError(request, { error: "weak_password", message: "Mật khẩu quá ngắn.", location: `${returnTo}?error=weak_password` });
 }

 try {
 const created = await adminCreateAccount(username, password, role);
 await setUserProfile(created.id, { fullName, displayName, phone, bio });
 return respondSuccess(request, { location: returnTo, message: "Đã tạo tài khoản mới." });
 } catch (error) {
 const message = error instanceof Error ? error.message :"";
 if (message.includes("duplicate key value")) {
  return respondError(request, { error: "username_taken", message: "Tên đăng nhập đã tồn tại.", location: `${returnTo}?error=username_taken` });
 }
 return respondError(request, { error: "create_failed", message: "Không thể tạo tài khoản.", location: `${returnTo}?error=create_failed` });
 }
}
