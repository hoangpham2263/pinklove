import { NextResponse } from"next/server";

import { getCurrentUserFromRequest } from"@/lib/auth";
import { setAppTheme, type ThemePreset } from"@/lib/app-settings";

export const runtime ="nodejs";

export async function POST(request: Request) {
 const user = await getCurrentUserFromRequest(request);
 if (!user) {
 return NextResponse.redirect(new URL("/admin/login", request.url), 303);
 }
 if (user.role !=="admin") {
 return NextResponse.redirect(new URL("/user/settings?error=forbidden", request.url), 303);
 }

 const formData = await request.formData();
 const value = String(formData.get("theme") ??"pink");
 const theme: ThemePreset =
 value ==="pink" ||
 value ==="blue" ||
 value ==="gray" ||
 value ==="green" ||
 value ==="yellow"
  ? value
  :"pink";

 await setAppTheme(theme);
 return NextResponse.redirect(new URL("/admin/settings?saved=theme", request.url), 303);
}
