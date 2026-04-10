import { NextResponse } from"next/server";
import { ROUTES } from "@/lib/routes";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/constants";

import {
 countUsers,
 createSession,
 getSessionCookieOptions,
 isAdminRole,
 registerUser,
 SESSION_COOKIE_NAME,
 USER_ROLES,
} from"@/lib/auth";

export const runtime ="nodejs";

export async function POST(request: Request) {
 const formData = await request.formData();
 const username = String(formData.get("username") ??"").trim();
 const password = String(formData.get("password") ??"");

 if (!username || !password) {
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.REGISTER}?error=missing_fields` } });
 }

 if (password.length < MIN_PASSWORD_LENGTH) {
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.REGISTER}?error=weak_password` } });
 }

 try {
 const totalUsers = await countUsers();
 const role = totalUsers === 0 ? USER_ROLES.ADMIN : USER_ROLES.CUSTOMER;
 const user = await registerUser(username, password, role);
 const token = await createSession(user.id);
 const target = isAdminRole(user.role) ? ROUTES.ADMIN.DASHBOARD : ROUTES.CUSTOMER.DASHBOARD;
 const response = new NextResponse(null, { status: 303, headers: { Location: target } });
 response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
 return response;
 } catch (error) {
 const message = error instanceof Error ? error.message :"";
 if (message.includes("duplicate key value")) {
  return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.REGISTER}?error=username_taken` } });
 }

 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.REGISTER}?error=register_failed` } });
}
}
