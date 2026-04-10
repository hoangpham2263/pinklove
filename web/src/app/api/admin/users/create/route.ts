import { adminCreateAccount, getCurrentUserFromRequest, type UserRole } from"@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/constants";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime ="nodejs";

export async function POST(request: Request) {
 const actor = await getCurrentUserFromRequest(request);
 if (!actor) {
 return respondError(request, { status: 401, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập admin.", location: ROUTES.ADMIN.LOGIN });
 }
 if (actor.role !=="admin") {
 return respondError(request, { status: 403, error: "FORBIDDEN", message: "Bạn không có quyền tạo tài khoản.", location: ROUTES.USER.DASHBOARD });
 }

 const formData = await request.formData();
 const username = String(formData.get("username") ??"").trim();
 const password = String(formData.get("password") ??"");
 const roleInput = String(formData.get("role") ??"user");
 const role: UserRole = roleInput ==="admin" ?"admin" :"user";

 if (!username || !password) {
 return respondError(request, { error: "missing_fields", message: "Thiếu thông tin bắt buộc để tạo tài khoản.", location: `${ROUTES.ADMIN.USERS}?error=missing_fields` });
 }
 if (password.length < MIN_PASSWORD_LENGTH) {
 return respondError(request, { error: "weak_password", message: "Mật khẩu quá ngắn.", location: `${ROUTES.ADMIN.USERS}?error=weak_password` });
 }

 try {
 await adminCreateAccount(username, password, role);
 return respondSuccess(request, { location: ROUTES.ADMIN.USERS, message: "Đã tạo tài khoản mới." });
 } catch (error) {
 const message = error instanceof Error ? error.message :"";
 if (message.includes("duplicate key value")) {
  return respondError(request, { error: "username_taken", message: "Tên đăng nhập đã tồn tại.", location: `${ROUTES.ADMIN.USERS}?error=username_taken` });
 }
 return respondError(request, { error: "create_failed", message: "Không thể tạo tài khoản.", location: `${ROUTES.ADMIN.USERS}?error=create_failed` });
 }
}
