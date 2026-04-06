import { NextResponse } from"next/server";

import { adminUpdateAccount, getCurrentUserFromRequest, setUserProfile, type UserRole } from"@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime ="nodejs";

export async function POST(request: Request) {
 const actor = await getCurrentUserFromRequest(request);
 if (!actor) {
 return new NextResponse(null, { status: 303, headers: { Location: ROUTES.ADMIN.LOGIN } });
 }
 if (actor.role !=="admin") {
 return new NextResponse(null, { status: 303, headers: { Location: ROUTES.USER.DASHBOARD } });
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
 
 const userId = Number(userIdRaw);
 if (!Number.isFinite(userId) || userId <= 0) {
 return new NextResponse(null, { status: 303, headers: { Location: "/admin/user?error=invalid_user" } });
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
 
 return new NextResponse(null, { status: 303, headers: { Location: `/admin/user/${userId}?saved=updated` } });
 } catch (error) {
 const message = error instanceof Error ? error.message :"";
 if (message ==="USER_NOT_FOUND") {
  return new NextResponse(null, { status: 303, headers: { Location: "/admin/user?error=user_not_found" } });
 }
 if (message ==="CANNOT_CHANGE_SELF_ROLE") {
  return new NextResponse(null, { status: 303, headers: { Location: `/admin/user/${userId}?error=cannot_change_self` } });
 }
 if (message ==="LAST_ADMIN_PROTECTED") {
  return new NextResponse(null, { status: 303, headers: { Location: `/admin/user/${userId}?error=last_admin_protected` } });
 }
 return new NextResponse(null, { status: 303, headers: { Location: `/admin/user/${userId}?error=update_failed` } });
 }
}
