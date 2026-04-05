import { NextResponse } from"next/server";

import { adminUpdateAccount, getCurrentUserFromRequest, setUserProfile, type UserRole } from"@/lib/auth";

export const runtime ="nodejs";

export async function POST(request: Request) {
 const actor = await getCurrentUserFromRequest(request);
 if (!actor) {
 return NextResponse.redirect(new URL("/admin/login", request.url), 303);
 }
 if (actor.role !=="admin") {
 return NextResponse.redirect(new URL("/user/dashboard", request.url), 303);
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
 return NextResponse.redirect(new URL("/admin/user?error=invalid_user", request.url), 303);
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
 
 return NextResponse.redirect(new URL(`/admin/user/${userId}?saved=updated`, request.url), 303);
 } catch (error) {
 const message = error instanceof Error ? error.message :"";
 if (message ==="USER_NOT_FOUND") {
  return NextResponse.redirect(new URL("/admin/user?error=user_not_found", request.url), 303);
 }
 if (message ==="CANNOT_CHANGE_SELF_ROLE") {
  return NextResponse.redirect(new URL(`/admin/user/${userId}?error=cannot_change_self`, request.url), 303);
 }
 if (message ==="LAST_ADMIN_PROTECTED") {
  return NextResponse.redirect(new URL(`/admin/user/${userId}?error=last_admin_protected`, request.url), 303);
 }
 return NextResponse.redirect(new URL(`/admin/user/${userId}?error=update_failed`, request.url), 303);
 }
}
