import { NextResponse } from"next/server";
import { ROUTES } from "@/lib/routes";

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

 if (!email || !password) {
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.ADMIN.LOGIN}?error=missing_fields` } });
 }

 const user = await authenticateUserByEmail(email, password);
 if (!user) {
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.ADMIN.LOGIN}?error=invalid_credentials` } });
 }

 if (!isAdminRole(user.role)) {
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.ADMIN.LOGIN}?error=invalid_credentials` } });
 }

 const token = await createSession(user.id);
 const response = new NextResponse(null, { status: 303, headers: { Location: ROUTES.ADMIN.DASHBOARD } });
 response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
 return response;
}
