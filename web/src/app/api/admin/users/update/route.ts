import { adminSetProviderAccountStatus, adminUpdateAccount, getCurrentUserFromRequest, getUserAccount, isAdminRole, setUserProfile, type AccountStatus } from"@/lib/auth";
import { parseUserRole, type UserRole } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";
import { assignAdminRole } from "@/features/access/server/service";

export const runtime ="nodejs";

export async function POST(request: Request) {
 const actor = await getCurrentUserFromRequest(request);
 if (!actor) {
 return respondError(request, { status: 401, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập admin.", location: ROUTES.ADMIN.LOGIN });
 }
 if (!isAdminRole(actor.role)) {
 return respondError(request, { status: 403, error: "FORBIDDEN", message: "Bạn không có quyền cập nhật người dùng.", location: ROUTES.CUSTOMER.DASHBOARD });
 }

 const formData = await request.formData();
 const userIdRaw = String(formData.get("userId") ??"");
 const username = String(formData.get("username") ??"").trim();
 const password = String(formData.get("password") ??"");
 const accessRole = String(formData.get("accessRole") ?? "").trim();
 const returnTo = String(formData.get("returnTo") ?? `${ROUTES.ADMIN.USERS}/${userIdRaw}`).trim();
 
 // Profile fields
 const fullName = String(formData.get("fullName") ??"").trim();
 const displayName = String(formData.get("displayName") ??"").trim();
 const phone = String(formData.get("phone") ??"").trim();
 const bio = String(formData.get("bio") ??"").trim();
 const nextStatusInput = String(formData.get("nextStatus") ?? "").trim();
 const statusReason = String(formData.get("reason") ?? "").trim();
 const adminRoleId = accessRole.startsWith("admin:") ? accessRole.slice(6).trim() : "";
 
 const userId = userIdRaw.trim();
 if (!userId) {
 return respondError(request, { error: "invalid_user", message: "Người dùng không hợp lệ.", location: `${ROUTES.ADMIN.USERS}?error=invalid_user` });
 }
 const returnLocation = returnTo || `${ROUTES.ADMIN.USERS}/${userId}`;

 const data: { username?: string; password?: string; role?: UserRole } = {};
 if (username) data.username = username;
 if (password) data.password = password;
 if (accessRole) {
  data.role = adminRoleId ? "ADMIN" : parseUserRole(accessRole.replace(/^portal:/, ""));
 }

 try {
 if (actor.id !== userId) {
  const nextRole = data.role ?? (await getUserAccount(userId))?.role;
  await assignAdminRole(userId, nextRole === "ADMIN" ? adminRoleId : null, actor.id);
 }
 // Update account basic info after RBAC guards protect the final Super Admin.
 await adminUpdateAccount(actor.id, userId, data);
 
 // Update profile info
 await setUserProfile(userId, {
  fullName,
  displayName,
  phone,
  bio
 });

 if (isAccountStatus(nextStatusInput)) {
  const existing = await getUserAccount(userId);
  if (existing && (existing.accountStatus !== nextStatusInput || (existing.accountStatusReason ?? "") !== statusReason)) {
   await adminSetProviderAccountStatus(actor.id, userId, nextStatusInput, statusReason);
  }
 }
 
 return respondSuccess(request, { message: "Đã cập nhật tài khoản.", location: returnLocation });
} catch (error) {
 const message = error instanceof Error ? error.message :"";
 if (message ==="USER_NOT_FOUND") {
  return respondError(request, { error: "user_not_found", message: "Không tìm thấy người dùng.", location: `${ROUTES.ADMIN.USERS}?error=user_not_found` });
 }
 if (message ==="CANNOT_CHANGE_SELF_ROLE") {
  return respondError(request, { error: "cannot_change_self", message: "Không thể tự đổi vai trò của chính bạn.", location: `${returnLocation}?error=cannot_change_self` });
 }
 if (message ==="LAST_ADMIN_PROTECTED") {
  return respondError(request, { error: "last_admin_protected", message: "Không thể hạ quyền quản trị viên cuối cùng.", location: `${returnLocation}?error=last_admin_protected` });
 }
 if (message === "LAST_SUPER_ADMIN") {
  return respondError(request, { error: "last_super_admin", message: "Không thể hạ quyền Super Admin cuối cùng.", location: `${returnLocation}?error=last_super_admin` });
 }
 return respondError(request, { error: "update_failed", message: "Không thể cập nhật người dùng.", location: `${returnLocation}?error=update_failed` });
}
}

function isAccountStatus(value: string): value is AccountStatus {
 return value === "active" || value === "blocked" || value === "banned" || value === "deleted";
}
