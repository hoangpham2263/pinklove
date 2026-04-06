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
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.ADMIN.LOGIN}?error=missing_fields` } });
 }

 const user = await authenticateUser(username, password);
 if (!user) {
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.ADMIN.LOGIN}?error=invalid_credentials` } });
 }

 if (user.role !=="admin") {
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.ADMIN.LOGIN}?error=invalid_credentials` } });
 }

 const token = await createSession(user.id);
 const response = new NextResponse(null, { status: 303, headers: { Location: ROUTES.ADMIN.DASHBOARD } });
 response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
 return response;
}
