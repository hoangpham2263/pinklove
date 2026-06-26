import { NextResponse } from"next/server";
import { ROUTES } from "@/lib/routes";
import { AuthCsrfError, verifyAuthCsrfToken } from "@/lib/auth-csrf";
import { AuthRateLimitError, checkAuthRateLimit, getRequestIp, recordAuthRateLimit, resetAuthRateLimit } from "@/lib/auth-rate-limit";
import { recordSecurityEvent } from "@/lib/security-events";

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
 const csrfToken = String(formData.get("csrfToken") ?? "");
 const returnToInput = String(formData.get("returnTo") ?? "").trim();
 const returnTo = returnToInput ? sanitizeReturnTo(returnToInput) : ROUTES.CUSTOMER.DASHBOARD;

 if (!email || !password) {
 await recordSecurityEvent({
  request,
  eventType: "login_failed",
  severity: "warn",
  status: 303,
  metadata: { scope: "public", reason: "missing_fields" },
 });
 return new NextResponse(null, { status: 303, headers: { Location: buildLoginLocation("missing_fields", returnToInput || undefined) } });
 }

 try {
 await verifyAuthCsrfToken("login", csrfToken);

 const requestIp = getRequestIp(request);
 await checkAuthRateLimit("login:ip", requestIp);
 await checkAuthRateLimit("login:email", email);

 const user = await authenticateUserByEmail(email, password);
 if (!user) {
 await recordAuthRateLimit("login:ip", requestIp);
 await recordAuthRateLimit("login:email", email);
 await recordSecurityEvent({
  request,
  eventType: "login_failed",
  severity: "warn",
  status: 303,
  metadata: { scope: "public", reason: "invalid_credentials" },
 });
 return new NextResponse(null, { status: 303, headers: { Location: buildLoginLocation("invalid_credentials", returnToInput || undefined) } });
 }

 if (!canAccessUserPortal(user.role)) {
 await recordAuthRateLimit("login:ip", requestIp);
 await recordAuthRateLimit("login:email", email);
 await recordSecurityEvent({
  request,
  eventType: "login_failed",
  severity: "warn",
  status: 303,
  userId: user.id,
  metadata: { scope: "public", reason: "role_denied" },
 });
 return new NextResponse(null, { status: 303, headers: { Location: buildLoginLocation("invalid_credentials", returnToInput || undefined) } });
 }

 await resetAuthRateLimit("login:email", email);
 await resetAuthRateLimit("login:ip", requestIp);
 await recordSecurityEvent({
  request,
  eventType: "login_success",
  status: 303,
  userId: user.id,
  metadata: { scope: "public" },
 });

 const token = await createSession(user.id);
 const target = returnTo;
 const response = new NextResponse(null, { status: 303, headers: { Location: target } });
 response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
 return response;
 } catch (error) {
 if (error instanceof AuthCsrfError) {
  await recordSecurityEvent({
   request,
   eventType: "csrf_failed",
   severity: "warn",
   status: 303,
   metadata: { scope: "login" },
  });
  return new NextResponse(null, { status: 303, headers: { Location: buildLoginLocation("invalid_credentials", returnToInput || undefined) } });
 }

 if (error instanceof AuthRateLimitError) {
  await recordSecurityEvent({
   request,
   eventType: "rate_limited",
   severity: "warn",
   status: 303,
   metadata: { scope: "public_login" },
  });
  return new NextResponse(null, { status: 303, headers: { Location: buildLoginLocation("rate_limited", returnToInput || undefined) } });
 }

 throw error;
 }
}
