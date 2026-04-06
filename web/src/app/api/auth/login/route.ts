import { NextResponse } from"next/server";
import { ROUTES } from "@/lib/routes";

import {
 authenticateUser,
 createSession,
 SESSION_COOKIE_NAME,
 getSessionCookieOptions,
} from"@/lib/auth";

export const runtime ="nodejs";

export async function POST(request: Request) {
 const formData = await request.formData();
 const username = String(formData.get("username") ??"").trim();
 const password = String(formData.get("password") ??"");

 if (!username || !password) {
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.LOGIN}?error=missing_fields` } });
 }

 const user = await authenticateUser(username, password);
 if (!user) {
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.LOGIN}?error=invalid_credentials` } });
 }

 if (user.role !=="user") {
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.LOGIN}?error=invalid_credentials` } });
 }

 const token = await createSession(user.id);
 const target =ROUTES.USER.DASHBOARD;
 const response = new NextResponse(null, { status: 303, headers: { Location: target } });
 response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
 return response;
}
