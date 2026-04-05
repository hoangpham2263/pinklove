import { NextResponse } from"next/server";

import {
 authenticateUser,
 createSession,
 SESSION_COOKIE_NAME,
 getSessionCookieOptions,
} from"@/lib/auth";

export const runtime ="nodejs";

export async function POST(request: Request) {
 const formData = await request.formData();
 const username = String(formData.get("username") ??"").trim();
 const password = String(formData.get("password") ??"");

 if (!username || !password) {
 return NextResponse.redirect(new URL("/admin/login?error=missing_fields", request.url), 303);
 }

 const user = await authenticateUser(username, password);
 if (!user) {
 return NextResponse.redirect(new URL("/admin/login?error=invalid_credentials", request.url), 303);
 }

 if (user.role !=="admin") {
 return NextResponse.redirect(new URL("/admin/login?error=invalid_credentials", request.url), 303);
 }

 const token = await createSession(user.id);
 const response = NextResponse.redirect(new URL("/admin/dashboard", request.url), 303);
 response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
 return response;
}
