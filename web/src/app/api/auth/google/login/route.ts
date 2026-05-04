import { randomBytes } from"node:crypto";
import { NextResponse } from"next/server";

import { buildGoogleAuthUrl } from"@/lib/google-oauth";
import { ROUTES } from "@/lib/routes";

export const runtime ="nodejs";

const GOOGLE_OAUTH_STATE_COOKIE ="pinklove_google_oauth_state";

export async function GET() {
 try {
 const state = randomBytes(24).toString("hex");
 const authUrl = await buildGoogleAuthUrl(state);
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
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.LOGIN}?error=google_not_configured` } });
 }
}
