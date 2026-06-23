import { NextResponse } from "next/server";

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
  const returnToInput = String(formData.get("returnTo") ?? "").trim();
  const returnTo = returnToInput ? sanitizeProviderReturnTo(returnToInput) : ROUTES.PROVIDER.ROOT;
  const loginPage = ROUTES.PROVIDER.LOGIN;

  if (!email || !password) {
    return new NextResponse(null, { status: 303, headers: { Location: `${loginPage}?error=missing_fields` } });
  }

  const user = await authenticateUserByEmail(email, password);
  if (!user || !isProviderRole(user.role)) {
    return new NextResponse(null, { status: 303, headers: { Location: `${loginPage}?error=invalid_credentials` } });
  }

  const token = await createSession(user.id);
  const nextLocation = returnTo;
  const response = new NextResponse(null, { status: 303, headers: { Location: nextLocation } });
  response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
  return response;
}
