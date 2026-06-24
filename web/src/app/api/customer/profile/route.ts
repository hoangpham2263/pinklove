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
 const providerPortalSlug = String(formData.get("providerPortalSlug") ?? "");
 const bio = String(formData.get("bio") ??"");
 const avatarUrl = String(formData.get("avatarUrl") ?? "");

 try {
  await setUserProfile(user.id, { fullName, displayName, phone, providerPortalSlug, bio, avatarUrl });
 } catch (error) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("user_profiles_phone_normalized_uidx")) {
   if (wantsJson) {
    return NextResponse.json({ error: "Số điện thoại này đã được sử dụng." }, { status: 409 });
   }
   return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.CUSTOMER.CONFIG_PROFILE}?error=phone_taken` } });
  }
  throw error;
 }
 if (wantsJson) {
 return NextResponse.json({ success: true });
 }
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.CUSTOMER.CONFIG_PROFILE}?saved=1` } });
}
