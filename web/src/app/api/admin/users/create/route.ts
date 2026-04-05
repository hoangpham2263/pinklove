import { NextResponse } from"next/server";

import { adminCreateAccount, getCurrentUserFromRequest, type UserRole } from"@/lib/auth";

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
 const username = String(formData.get("username") ??"").trim();
 const password = String(formData.get("password") ??"");
 const roleInput = String(formData.get("role") ??"user");
 const role: UserRole = roleInput ==="admin" ?"admin" :"user";

 if (!username || !password) {
 return NextResponse.redirect(new URL("/admin/user?error=missing_fields", request.url), 303);
 }
 if (password.length < 6) {
 return NextResponse.redirect(new URL("/admin/user?error=weak_password", request.url), 303);
 }

 try {
 await adminCreateAccount(username, password, role);
 return NextResponse.redirect(new URL("/admin/user?saved=created", request.url), 303);
 } catch (error) {
 const message = error instanceof Error ? error.message :"";
 if (message.includes("duplicate key value")) {
  return NextResponse.redirect(new URL("/admin/user?error=username_taken", request.url), 303);
 }
 return NextResponse.redirect(new URL("/admin/user?error=create_failed", request.url), 303);
 }
}
