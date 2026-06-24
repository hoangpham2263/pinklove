import { NextResponse } from"next/server";
import { ROUTES } from "@/lib/routes";
import { AuthRateLimitError, getRequestIp, recordAuthRateLimit, resetAuthRateLimit } from "@/lib/auth-rate-limit";

import {
 authenticateUserByEmail,
 canAccessUserPortal,
 createSession,
 SESSION_COOKIE_NAME,
 getSessionCookieOptions,
} from"@/lib/auth";

export const runtime ="nodejs";

function sanitizeReturnTo(value: string): string {
 if (!value.startsWith("/")) return ROUTES.CUSTOMER.DASHBOARD;
 if (value.startsWith("//")) return ROUTES.CUSTOMER.DASHBOARD;
 return value;
}

function buildLoginLocation(error: string, returnTo?: string) {
 const params = new URLSearchParams({ error });
 if (returnTo) {
  params.set("returnTo", returnTo);
 }
 return `${ROUTES.AUTH.LOGIN}?${params.toString()}`;
}

export async function POST(request: Request) {
 const formData = await request.formData();
 const email = String(formData.get("email") ??"").trim();
 const password = String(formData.get("password") ??"");
 const returnToInput = String(formData.get("returnTo") ?? "").trim();
 const returnTo = returnToInput ? sanitizeReturnTo(returnToInput) : ROUTES.CUSTOMER.DASHBOARD;

 if (!email || !password) {
 return new NextResponse(null, { status: 303, headers: { Location: buildLoginLocation("missing_fields", returnToInput || undefined) } });
 }

 try {
 const user = await authenticateUserByEmail(email, password);
 if (!user) {
 await recordAuthRateLimit("login:ip", getRequestIp(request));
 await recordAuthRateLimit("login:email", email);
 return new NextResponse(null, { status: 303, headers: { Location: buildLoginLocation("invalid_credentials", returnToInput || undefined) } });
 }

 if (!canAccessUserPortal(user.role)) {
 await recordAuthRateLimit("login:ip", getRequestIp(request));
 await recordAuthRateLimit("login:email", email);
 return new NextResponse(null, { status: 303, headers: { Location: buildLoginLocation("invalid_credentials", returnToInput || undefined) } });
 }

 await resetAuthRateLimit("login:email", email);

 const token = await createSession(user.id);
 const target = returnTo;
 const response = new NextResponse(null, { status: 303, headers: { Location: target } });
 response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
 return response;
 } catch (error) {
 if (error instanceof AuthRateLimitError) {
  return new NextResponse(null, { status: 303, headers: { Location: buildLoginLocation("rate_limited", returnToInput || undefined) } });
 }

 throw error;
 }
}
