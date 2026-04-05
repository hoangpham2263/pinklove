import { cookies } from"next/headers";
import { NextResponse } from"next/server";

import {
 authenticateGoogleUser,
 createSession,
 getSessionCookieOptions,
 SESSION_COOKIE_NAME,
} from"@/lib/auth";
import { exchangeCodeForGoogleUser } from"@/lib/google-oauth";

export const runtime ="nodejs";

const GOOGLE_OAUTH_STATE_COOKIE ="pinklove_google_oauth_state";

export async function GET(request: Request) {
 const url = new URL(request.url);
 const code = url.searchParams.get("code");
 const state = url.searchParams.get("state");
 if (!code || !state) {
 return NextResponse.redirect(new URL("/user/login?error=google_callback_invalid", request.url), 303);
 }

 const cookieStore = await cookies();
 const expectedState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
 if (!expectedState || expectedState !== state) {
 return NextResponse.redirect(new URL("/user/login?error=google_state_invalid", request.url), 303);
 }

 try {
 const googleUser = await exchangeCodeForGoogleUser(code);
 const appUser = await authenticateGoogleUser({
  providerUserId: googleUser.sub,
  email: googleUser.email,
  name: googleUser.name,
 });

 if (appUser.role !=="user") {
  return NextResponse.redirect(new URL("/user/login?error=invalid_credentials", request.url), 303);
 }

 const token = await createSession(appUser.id);
 const target ="/user/dashboard";
 const response = NextResponse.redirect(new URL(target, request.url), 303);
 response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
 response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE,"", {
  httpOnly: true,
  sameSite:"lax",
  secure: process.env.NODE_ENV ==="production",
  path:"/",
  maxAge: 0,
 });
 return response;
 } catch {
 return NextResponse.redirect(new URL("/user/login?error=google_login_failed", request.url), 303);
 }
}
