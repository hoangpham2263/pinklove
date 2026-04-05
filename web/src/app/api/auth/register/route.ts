import { NextResponse } from"next/server";

import {
 countUsers,
 createSession,
 getSessionCookieOptions,
 registerUser,
 SESSION_COOKIE_NAME,
} from"@/lib/auth";

export const runtime ="nodejs";

export async function POST(request: Request) {
 const formData = await request.formData();
 const username = String(formData.get("username") ??"").trim();
 const password = String(formData.get("password") ??"");

 if (!username || !password) {
 return NextResponse.redirect(new URL("/user/register?error=missing_fields", request.url), 303);
 }

 if (password.length < 6) {
 return NextResponse.redirect(new URL("/user/register?error=weak_password", request.url), 303);
 }

 try {
 const totalUsers = await countUsers();
 const role = totalUsers === 0 ?"admin" :"user";
 const user = await registerUser(username, password, role);
 const token = await createSession(user.id);
 const target = user.role ==="admin" ?"/admin/dashboard" :"/user/dashboard";
 const response = NextResponse.redirect(new URL(target, request.url), 303);
 response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
 return response;
 } catch (error) {
 const message = error instanceof Error ? error.message :"";
 if (message.includes("duplicate key value")) {
  return NextResponse.redirect(new URL("/user/register?error=username_taken", request.url), 303);
 }

 return NextResponse.redirect(new URL("/user/register?error=register_failed", request.url), 303);
 }
}
