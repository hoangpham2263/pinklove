import { NextResponse } from "next/server";

import { AuthCsrfError, verifyAuthCsrfToken } from "@/lib/auth-csrf";
import { AuthRateLimitError, checkAuthRateLimit, getRequestIp, recordAuthRateLimit, resetAuthRateLimit } from "@/lib/auth-rate-limit";
import { recordSecurityEvent } from "@/lib/security-events";
import {
  authenticateUserByEmail,
  createSession,
  getSessionCookieOptions,
  isProviderRole,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

function sanitizeProviderReturnTo(value: string): string {
  if (!value.startsWith("/")) return ROUTES.PROVIDER.ROOT;
  if (!value.startsWith(ROUTES.PROVIDER.ROOT)) return ROUTES.PROVIDER.ROOT;
  return value;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const csrfToken = String(formData.get("csrfToken") ?? "");
  const returnToInput = String(formData.get("returnTo") ?? "").trim();
  const returnTo = returnToInput ? sanitizeProviderReturnTo(returnToInput) : ROUTES.PROVIDER.ROOT;
  const loginPage = ROUTES.PROVIDER.LOGIN;

  if (!email || !password) {
    await recordSecurityEvent({
      request,
      eventType: "login_failed",
      severity: "warn",
      status: 303,
      metadata: { scope: "provider", reason: "missing_fields" },
    });
    return new NextResponse(null, { status: 303, headers: { Location: `${loginPage}?error=missing_fields` } });
  }

  try {
    await verifyAuthCsrfToken("provider_login", csrfToken);

    const requestIp = getRequestIp(request);
    await checkAuthRateLimit("provider_login:ip", requestIp);
    await checkAuthRateLimit("provider_login:email", email);

    const user = await authenticateUserByEmail(email, password);
    if (!user || !isProviderRole(user.role)) {
      await recordAuthRateLimit("provider_login:ip", requestIp);
      await recordAuthRateLimit("provider_login:email", email);
      await recordSecurityEvent({
        request,
        eventType: "login_failed",
        severity: "warn",
        status: 303,
        userId: user?.id ?? null,
        metadata: { scope: "provider", reason: user ? "role_denied" : "invalid_credentials" },
      });
      return new NextResponse(null, { status: 303, headers: { Location: `${loginPage}?error=invalid_credentials` } });
    }

    await resetAuthRateLimit("provider_login:email", email);
    await resetAuthRateLimit("provider_login:ip", requestIp);
    await recordSecurityEvent({
      request,
      eventType: "login_success",
      status: 303,
      userId: user.id,
      metadata: { scope: "provider" },
    });

    const token = await createSession(user.id);
    const nextLocation = returnTo;
    const response = new NextResponse(null, { status: 303, headers: { Location: nextLocation } });
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
    return response;
  } catch (error) {
    if (error instanceof AuthCsrfError) {
      await recordSecurityEvent({
        request,
        eventType: "csrf_failed",
        severity: "warn",
        status: 303,
        metadata: { scope: "provider_login" },
      });
      return new NextResponse(null, { status: 303, headers: { Location: `${loginPage}?error=invalid_credentials` } });
    }

    if (error instanceof AuthRateLimitError) {
      await recordSecurityEvent({
        request,
        eventType: "rate_limited",
        severity: "warn",
        status: 303,
        metadata: { scope: "provider_login" },
      });
      return new NextResponse(null, { status: 303, headers: { Location: `${loginPage}?error=rate_limited` } });
    }

    throw error;
  }
}
