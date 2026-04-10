import { NextResponse } from"next/server";

import { getCurrentUserFromRequest, setUserProfile } from"@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime ="nodejs";

export async function POST(request: Request) {
 const wantsJson = request.headers.get("accept")?.includes("application/json") ?? false;
 const user = await getCurrentUserFromRequest(request);
 if (!user) {
 if (wantsJson) {
  return NextResponse.json({ error:"Please login first." }, { status: 401 });
 }
 return new NextResponse(null, { status: 303, headers: { Location: ROUTES.AUTH.LOGIN } });
 }

 const formData = await request.formData();
 const fullName = String(formData.get("fullName") ??"");
 const displayName = String(formData.get("displayName") ??"");
 const phone = String(formData.get("phone") ??"");
 const bio = String(formData.get("bio") ??"");

 await setUserProfile(user.id, { fullName, displayName, phone, bio });
 if (wantsJson) {
 return NextResponse.json({ success: true });
 }
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.USER.PROFILE}?saved=1` } });
}
