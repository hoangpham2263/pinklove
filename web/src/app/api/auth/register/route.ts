import { NextResponse } from"next/server";
import { ROUTES } from "@/lib/routes";

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
 return new NextResponse(null, { status: 303, headers: { Location: "/user/register?error=missing_fields" } });
 }

 if (password.length < 6) {
 return new NextResponse(null, { status: 303, headers: { Location: "/user/register?error=weak_password" } });
 }

 try {
 const totalUsers = await countUsers();
 const role = totalUsers === 0 ?"admin" :"user";
 const user = await registerUser(username, password, role);
 const token = await createSession(user.id);
 const target = user.role ==="admin" ?ROUTES.ADMIN.DASHBOARD :ROUTES.USER.DASHBOARD;
 const response = new NextResponse(null, { status: 303, headers: { Location: target } });
 response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
 return response;
 } catch (error) {
 const message = error instanceof Error ? error.message :"";
 if (message.includes("duplicate key value")) {
  return new NextResponse(null, { status: 303, headers: { Location: "/user/register?error=username_taken" } });
 }

 return new NextResponse(null, { status: 303, headers: { Location: "/user/register?error=register_failed" } });
 }
}
