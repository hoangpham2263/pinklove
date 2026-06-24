import { NextResponse } from"next/server";
import { ROUTES } from "@/lib/routes";
import { AuthCsrfError, verifyAuthCsrfToken } from "@/lib/auth-csrf";
import { AuthRateLimitError, checkAuthRateLimit, getRequestIp, recordAuthRateLimit, resetAuthRateLimit } from "@/lib/auth-rate-limit";

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
 return new NextResponse(null, { status: 303, headers: { Location: `${loginPage}?error=invalid_credentials` } });
 }

 if (!isAdminRole(user.role)) {
 await recordAuthRateLimit("admin_login:ip", requestIp);
 await recordAuthRateLimit("admin_login:email", email);
 return new NextResponse(null, { status: 303, headers: { Location: `${loginPage}?error=invalid_credentials` } });
 }

 await resetAuthRateLimit("admin_login:email", email);
 await resetAuthRateLimit("admin_login:ip", requestIp);

 const token = await createSession(user.id);
 const response = new NextResponse(null, { status: 303, headers: { Location: ROUTES.ADMIN.DASHBOARD } });
 response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
 return response;
 } catch (error) {
 if (error instanceof AuthCsrfError) {
  return new NextResponse(null, { status: 303, headers: { Location: `${loginPage}?error=invalid_credentials` } });
 }

 if (error instanceof AuthRateLimitError) {
  return new NextResponse(null, { status: 303, headers: { Location: `${loginPage}?error=rate_limited` } });
 }

 throw error;
 }
}
