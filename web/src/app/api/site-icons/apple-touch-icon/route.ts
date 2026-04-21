import { NextResponse } from "next/server";
import { getSystemSettings } from "@/lib/system-settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function resolveIconUrl(request: Request, value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("data:")) {
    return null;
  }

  const url = new URL(trimmed, request.url);
  if (url.pathname === "/apple-touch-icon.png" || url.pathname === "/api/site-icons/apple-touch-icon") {
    return null;
  }

  return url;
}

export async function GET(request: Request) {
  const settings = await getSystemSettings();
  const iconUrl = resolveIconUrl(request, settings.favicon.appleTouchIcon);

  if (!iconUrl) {
    return new NextResponse(null, {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.redirect(iconUrl, {
    status: 307,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
