import { NextResponse } from"next/server";

import { adminCreateAccount, getCurrentUserFromRequest, type UserRole } from"@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/constants";

export const runtime ="nodejs";

export async function POST(request: Request) {
 const actor = await getCurrentUserFromRequest(request);
 if (!actor) {
 return new NextResponse(null, { status: 303, headers: { Location: ROUTES.ADMIN.LOGIN } });
 }
 if (actor.role !=="admin") {
 return new NextResponse(null, { status: 303, headers: { Location: ROUTES.USER.DASHBOARD } });
 }

 const formData = await request.formData();
 const username = String(formData.get("username") ??"").trim();
 const password = String(formData.get("password") ??"");
 const roleInput = String(formData.get("role") ??"user");
 const role: UserRole = roleInput ==="admin" ?"admin" :"user";

 if (!username || !password) {
 return new NextResponse(null, { status: 303, headers: { Location: "/admin/user?error=missing_fields" } });
 }
 if (password.length < MIN_PASSWORD_LENGTH) {
 return new NextResponse(null, { status: 303, headers: { Location: "/admin/user?error=weak_password" } });
 }

 try {
 await adminCreateAccount(username, password, role);
 return new NextResponse(null, { status: 303, headers: { Location: "/admin/user?saved=created" } });
 } catch (error) {
 const message = error instanceof Error ? error.message :"";
 if (message.includes("duplicate key value")) {
  return new NextResponse(null, { status: 303, headers: { Location: "/admin/user?error=username_taken" } });
 }
 return new NextResponse(null, { status: 303, headers: { Location: "/admin/user?error=create_failed" } });
 }
}
