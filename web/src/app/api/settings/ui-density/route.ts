import { NextResponse } from"next/server";

import { getCurrentUserFromRequest, setUserDensity } from"@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime ="nodejs";

export async function POST(request: Request) {
 const user = await getCurrentUserFromRequest(request);
 if (!user) {
 return new NextResponse(null, { status: 303, headers: { Location: ROUTES.AUTH.LOGIN } });
 }
 if (user.role !=="admin") {
 return new NextResponse(null, { status: 303, headers: { Location: "/user/settings?error=forbidden" } });
 }

 const formData = await request.formData();
 const value = String(formData.get("uiDensity") ??"medium");
 const uiDensity:"small" |"medium" |"large" =
 value ==="small" || value ==="large" ? value :"medium";

 await setUserDensity(user.id, uiDensity);
 return new NextResponse(null, { status: 303, headers: { Location: "/admin/settings?saved=density" } });
}
