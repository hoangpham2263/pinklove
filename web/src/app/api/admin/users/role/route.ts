import { NextResponse } from"next/server";

import { adminUpdateRole, getCurrentUserFromRequest, type UserRole } from"@/lib/auth";
import { ROUTES } from "@/lib/routes";

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
 const userIdRaw = String(formData.get("userId") ??"");
 const roleInput = String(formData.get("role") ??"user");
 const nextRole: UserRole = roleInput ==="admin" ?"admin" :"user";
 const userId = userIdRaw.trim();

 if (!userId) {
 return new NextResponse(null, { status: 303, headers: { Location: "/admin/user?error=invalid_user" } });
 }

 try {
 await adminUpdateRole(actor.id, userId, nextRole);
 return new NextResponse(null, { status: 303, headers: { Location: "/admin/user?saved=role_updated" } });
 } catch (error) {
 const message = error instanceof Error ? error.message :"";
 if (message ==="USER_NOT_FOUND") {
  return new NextResponse(null, { status: 303, headers: { Location: "/admin/user?error=user_not_found" } });
 }
 if (message ==="CANNOT_CHANGE_SELF_ROLE") {
  return new NextResponse(null, { status: 303, headers: { Location: "/admin/user?error=cannot_change_self" } });
 }
 if (message ==="LAST_ADMIN_PROTECTED") {
  return new NextResponse(null, { status: 303, headers: { Location: "/admin/user?error=last_admin_protected" } });
 }
 return new NextResponse(null, { status: 303, headers: { Location: "/admin/user?error=role_update_failed" } });
 }
}
