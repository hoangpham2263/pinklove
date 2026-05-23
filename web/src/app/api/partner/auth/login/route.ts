import { NextResponse } from "next/server";

import {
  authenticateUser,
  createSession,
  ensureProviderPortalSlug,
  getSessionCookieOptions,
  isProviderRole,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

function sanitizePartnerReturnTo(value: string): string {
  if (!value.startsWith("/")) return ROUTES.PARTNER.ROOT;
  if (!value.startsWith(ROUTES.PARTNER.ROOT)) return ROUTES.PARTNER.ROOT;
  return value;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const returnToInput = String(formData.get("returnTo") ?? "").trim();
  const portalSlug = String(formData.get("portalSlug") ?? "").trim();
  const returnTo = returnToInput
    ? sanitizePartnerReturnTo(returnToInput)
    : portalSlug
      ? ROUTES.PARTNER.PORTAL(portalSlug)
      : ROUTES.PARTNER.ROOT;
  const loginPage = portalSlug ? ROUTES.PARTNER.PORTAL(portalSlug) : ROUTES.PARTNER.LOGIN;

  if (!username || !password) {
    return new NextResponse(null, { status: 303, headers: { Location: `${loginPage}?error=missing_fields` } });
  }

  const user = await authenticateUser(username, password);
  if (!user || !isProviderRole(user.role)) {
    return new NextResponse(null, { status: 303, headers: { Location: `${loginPage}?error=invalid_credentials` } });
  }

  const ensuredPortalSlug = await ensureProviderPortalSlug(user.id);
  const token = await createSession(user.id);
  const nextLocation =
    portalSlug && ensuredPortalSlug === portalSlug
      ? returnTo
      : ensuredPortalSlug
        ? ROUTES.PARTNER.PORTAL(ensuredPortalSlug)
        : ROUTES.PARTNER.ROOT;
  const response = new NextResponse(null, { status: 303, headers: { Location: nextLocation } });
  response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
  return response;
}
