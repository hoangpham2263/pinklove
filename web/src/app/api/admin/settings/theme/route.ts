import { NextResponse } from"next/server";

import { getCurrentUserFromRequest } from"@/lib/auth";
import { setAppTheme, type ThemePreset } from"@/lib/app-settings";
import { ROUTES } from "@/lib/routes";

export const runtime ="nodejs";

export async function POST(request: Request) {
 const user = await getCurrentUserFromRequest(request);
 if (!user) {
 return new NextResponse(null, { status: 303, headers: { Location: ROUTES.ADMIN.LOGIN } });
 }
 if (user.role !=="admin") {
 return new NextResponse(null, { status: 303, headers: { Location: "/user/settings?error=forbidden" } });
 }

 const formData = await request.formData();
 const value = String(formData.get("theme") ?? "pink");
 const theme: ThemePreset =
  value === "pink" || value === "black"
   ? value
   : "pink";

 await setAppTheme(theme);
 return new NextResponse(null, { status: 303, headers: { Location: "/admin/settings?saved=theme" } });
}
