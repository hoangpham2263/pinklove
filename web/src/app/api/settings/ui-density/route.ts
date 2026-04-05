import { NextResponse } from"next/server";

import { getCurrentUserFromRequest, setUserDensity } from"@/lib/auth";

export const runtime ="nodejs";

export async function POST(request: Request) {
 const user = await getCurrentUserFromRequest(request);
 if (!user) {
 return NextResponse.redirect(new URL("/user/login", request.url), 303);
 }
 if (user.role !=="admin") {
 return NextResponse.redirect(new URL("/user/settings?error=forbidden", request.url), 303);
 }

 const formData = await request.formData();
 const value = String(formData.get("uiDensity") ??"medium");
 const uiDensity:"small" |"medium" |"large" =
 value ==="small" || value ==="large" ? value :"medium";

 await setUserDensity(user.id, uiDensity);
 return NextResponse.redirect(new URL("/admin/settings?saved=density", request.url), 303);
}
