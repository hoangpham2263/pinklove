import { NextResponse } from"next/server";

import { adminDeleteAccount, getCurrentUserFromRequest } from"@/lib/auth";
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
 const userId = String(formData.get("userId") ??"").trim();

 if (!userId) {
 return new NextResponse(null, { status: 303, headers: { Location: "/admin/user?error=invalid_user" } });
 }

 try {
 await adminDeleteAccount(actor.id, userId);
 return new NextResponse(null, { status: 303, headers: { Location: "/admin/user?saved=deleted" } });
 } catch (error) {
 const message = error instanceof Error ? error.message :"";
 if (message ==="USER_NOT_FOUND") {
  return new NextResponse(null, { status: 303, headers: { Location: "/admin/user?error=user_not_found" } });
 }
 if (message ==="CANNOT_DELETE_SELF") {
  return new NextResponse(null, { status: 303, headers: { Location: "/admin/user?error=cannot_delete_self" } });
 }
 if (message ==="LAST_ADMIN_PROTECTED") {
  return new NextResponse(null, { status: 303, headers: { Location: "/admin/user?error=last_admin_protected" } });
 }
 return new NextResponse(null, { status: 303, headers: { Location: "/admin/user?error=delete_failed" } });
 }
}
