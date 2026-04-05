import { NextResponse } from"next/server";

import { adminUpdateRole, getCurrentUserFromRequest, type UserRole } from"@/lib/auth";

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
 const roleInput = String(formData.get("role") ??"user");
 const nextRole: UserRole = roleInput ==="admin" ?"admin" :"user";
 const userId = Number(userIdRaw);

 if (!Number.isFinite(userId) || userId <= 0) {
 return NextResponse.redirect(new URL("/admin/user?error=invalid_user", request.url), 303);
 }

 try {
 await adminUpdateRole(actor.id, userId, nextRole);
 return NextResponse.redirect(new URL("/admin/user?saved=role_updated", request.url), 303);
 } catch (error) {
 const message = error instanceof Error ? error.message :"";
 if (message ==="USER_NOT_FOUND") {
  return NextResponse.redirect(new URL("/admin/user?error=user_not_found", request.url), 303);
 }
 if (message ==="CANNOT_CHANGE_SELF_ROLE") {
  return NextResponse.redirect(new URL("/admin/user?error=cannot_change_self", request.url), 303);
 }
 if (message ==="LAST_ADMIN_PROTECTED") {
  return NextResponse.redirect(new URL("/admin/user?error=last_admin_protected", request.url), 303);
 }
 return NextResponse.redirect(new URL("/admin/user?error=role_update_failed", request.url), 303);
 }
}
