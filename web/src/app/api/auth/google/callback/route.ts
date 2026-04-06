import { cookies } from"next/headers";
import { NextResponse } from"next/server";

import {
 authenticateGoogleUser,
 createSession,
 getSessionCookieOptions,
 SESSION_COOKIE_NAME,
} from"@/lib/auth";
import { exchangeCodeForGoogleUser } from"@/lib/google-oauth";
import { ROUTES } from "@/lib/routes";

export const runtime ="nodejs";

const GOOGLE_OAUTH_STATE_COOKIE ="pinklove_google_oauth_state";

export async function GET(request: Request) {
 const url = new URL(request.url);
 const code = url.searchParams.get("code");
 const state = url.searchParams.get("state");
 if (!code || !state) {
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.LOGIN}?error=google_callback_invalid` } });
 }

 const cookieStore = await cookies();
 const expectedState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
 if (!expectedState || expectedState !== state) {
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.LOGIN}?error=google_state_invalid` } });
 }

 try {
 const googleUser = await exchangeCodeForGoogleUser(code);
 const appUser = await authenticateGoogleUser({
  providerUserId: googleUser.sub,
  email: googleUser.email,
  name: googleUser.name,
 });

 if (appUser.role !=="user") {
  return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.LOGIN}?error=invalid_credentials` } });
 }

 const token = await createSession(appUser.id);
 const target =ROUTES.USER.DASHBOARD;
 const response = new NextResponse(null, { status: 303, headers: { Location: target } });
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
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.LOGIN}?error=google_login_failed` } });
 }
}
