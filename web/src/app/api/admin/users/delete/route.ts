import { NextResponse } from"next/server";

import { adminDeleteAccount, getCurrentUserFromRequest } from"@/lib/auth";

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
 const userId = Number(userIdRaw);

 if (!Number.isFinite(userId) || userId <= 0) {
 return NextResponse.redirect(new URL("/admin/user?error=invalid_user", request.url), 303);
 }

 try {
 await adminDeleteAccount(actor.id, userId);
 return NextResponse.redirect(new URL("/admin/user?saved=deleted", request.url), 303);
 } catch (error) {
 const message = error instanceof Error ? error.message :"";
 if (message ==="USER_NOT_FOUND") {
  return NextResponse.redirect(new URL("/admin/user?error=user_not_found", request.url), 303);
 }
 if (message ==="CANNOT_DELETE_SELF") {
  return NextResponse.redirect(new URL("/admin/user?error=cannot_delete_self", request.url), 303);
 }
 if (message ==="LAST_ADMIN_PROTECTED") {
  return NextResponse.redirect(new URL("/admin/user?error=last_admin_protected", request.url), 303);
 }
 return NextResponse.redirect(new URL("/admin/user?error=delete_failed", request.url), 303);
 }
}
