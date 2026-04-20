import { NextResponse } from"next/server";
import { ROUTES } from "@/lib/routes";

import {
 authenticateUser,
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
 const username = String(formData.get("username") ??"").trim();
 const password = String(formData.get("password") ??"");
 const returnToInput = String(formData.get("returnTo") ?? "").trim();
 const returnTo = returnToInput ? sanitizeReturnTo(returnToInput) : ROUTES.CUSTOMER.DASHBOARD;

 if (!username || !password) {
 return new NextResponse(null, { status: 303, headers: { Location: buildLoginLocation("missing_fields", returnToInput || undefined) } });
 }

 const user = await authenticateUser(username, password);
 if (!user) {
 return new NextResponse(null, { status: 303, headers: { Location: buildLoginLocation("invalid_credentials", returnToInput || undefined) } });
 }

 if (!canAccessUserPortal(user.role)) {
 return new NextResponse(null, { status: 303, headers: { Location: buildLoginLocation("invalid_credentials", returnToInput || undefined) } });
 }

 const token = await createSession(user.id);
 const target = returnTo;
 const response = new NextResponse(null, { status: 303, headers: { Location: target } });
 response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
 return response;
}
