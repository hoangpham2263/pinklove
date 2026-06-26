import { NextResponse } from"next/server";
import { ROUTES } from "@/lib/routes";
import { AuthCsrfError, verifyAuthCsrfToken } from "@/lib/auth-csrf";
import { AuthRateLimitError, checkAuthRateLimit, getRequestIp, recordAuthRateLimit, resetAuthRateLimit } from "@/lib/auth-rate-limit";
import { recordSecurityEvent } from "@/lib/security-events";

import {
 authenticateUserByEmail,
 createSession,
 isAdminRole,
 SESSION_COOKIE_NAME,
 getSessionCookieOptions,
} from"@/lib/auth";

export const runtime ="nodejs";

export async function POST(request: Request) {
 const formData = await request.formData();
 const email = String(formData.get("email") ??"").trim();
 const password = String(formData.get("password") ??"");
 const csrfToken = String(formData.get("csrfToken") ?? "");
 const loginPage = ROUTES.ADMIN.LOGIN;

 if (!email || !password) {
 await recordSecurityEvent({
  request,
  eventType: "login_failed",
  severity: "warn",
  status: 303,
  metadata: { scope: "admin", reason: "missing_fields" },
 });
 return new NextResponse(null, { status: 303, headers: { Location: `${loginPage}?error=missing_fields` } });
 }

 try {
 await verifyAuthCsrfToken("admin_login", csrfToken);

 const requestIp = getRequestIp(request);
 await checkAuthRateLimit("admin_login:ip", requestIp);
 await checkAuthRateLimit("admin_login:email", email);

 const user = await authenticateUserByEmail(email, password);
 if (!user) {
 await recordAuthRateLimit("admin_login:ip", requestIp);
 await recordAuthRateLimit("admin_login:email", email);
 await recordSecurityEvent({
  request,
  eventType: "login_failed",
  severity: "warn",
  status: 303,
  metadata: { scope: "admin", reason: "invalid_credentials" },
 });
 return new NextResponse(null, { status: 303, headers: { Location: `${loginPage}?error=invalid_credentials` } });
 }

 if (!isAdminRole(user.role)) {
 await recordAuthRateLimit("admin_login:ip", requestIp);
 await recordAuthRateLimit("admin_login:email", email);
 await recordSecurityEvent({
  request,
  eventType: "login_failed",
  severity: "warn",
  status: 303,
  userId: user.id,
  metadata: { scope: "admin", reason: "role_denied" },
 });
 return new NextResponse(null, { status: 303, headers: { Location: `${loginPage}?error=invalid_credentials` } });
 }

 await resetAuthRateLimit("admin_login:email", email);
 await resetAuthRateLimit("admin_login:ip", requestIp);
 await recordSecurityEvent({
  request,
  eventType: "login_success",
  status: 303,
  userId: user.id,
  metadata: { scope: "admin" },
 });
 await recordSecurityEvent({
  request,
  eventType: "admin_action",
  status: 303,
  userId: user.id,
  metadata: { action: "admin_login" },
 });

 const token = await createSession(user.id);
 const response = new NextResponse(null, { status: 303, headers: { Location: ROUTES.ADMIN.DASHBOARD } });
 response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
 return response;
 } catch (error) {
 if (error instanceof AuthCsrfError) {
  await recordSecurityEvent({
   request,
   eventType: "csrf_failed",
   severity: "warn",
   status: 303,
   metadata: { scope: "admin_login" },
  });
  return new NextResponse(null, { status: 303, headers: { Location: `${loginPage}?error=invalid_credentials` } });
 }

 if (error instanceof AuthRateLimitError) {
  await recordSecurityEvent({
   request,
   eventType: "rate_limited",
   severity: "warn",
   status: 303,
   metadata: { scope: "admin_login" },
  });
  return new NextResponse(null, { status: 303, headers: { Location: `${loginPage}?error=rate_limited` } });
 }

 throw error;
 }
}
