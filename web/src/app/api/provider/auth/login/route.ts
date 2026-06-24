import { NextResponse } from "next/server";

import { AuthCsrfError, verifyAuthCsrfToken } from "@/lib/auth-csrf";
import { AuthRateLimitError, checkAuthRateLimit, getRequestIp, recordAuthRateLimit, resetAuthRateLimit } from "@/lib/auth-rate-limit";
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
      return new NextResponse(null, { status: 303, headers: { Location: `${loginPage}?error=invalid_credentials` } });
    }

    await resetAuthRateLimit("provider_login:email", email);
    await resetAuthRateLimit("provider_login:ip", requestIp);

    const token = await createSession(user.id);
    const nextLocation = returnTo;
    const response = new NextResponse(null, { status: 303, headers: { Location: nextLocation } });
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
