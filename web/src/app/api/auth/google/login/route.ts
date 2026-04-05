import { randomBytes } from"node:crypto";
import { NextResponse } from"next/server";

import { buildGoogleAuthUrl } from"@/lib/google-oauth";

export const runtime ="nodejs";

const GOOGLE_OAUTH_STATE_COOKIE ="pinklove_google_oauth_state";

export async function GET(request: Request) {
 try {
 const state = randomBytes(24).toString("hex");
 const authUrl = buildGoogleAuthUrl(state);
 const response = NextResponse.redirect(authUrl, 303);

 response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
  httpOnly: true,
  sameSite:"lax",
  secure: process.env.NODE_ENV ==="production",
  path:"/",
  maxAge: 60 * 10,
 });

 return response;
 } catch {
 return NextResponse.redirect(new URL("/user/login?error=google_not_configured", request.url), 303);
 }
}
