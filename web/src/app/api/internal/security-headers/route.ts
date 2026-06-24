import { NextResponse } from "next/server";

import { INTERNAL_API_KEY_HEADER } from "@/lib/api";
import { getSystemSettings } from "@/lib/system-settings";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const expectedSecret = process.env.INTERNAL_API_SECRET?.trim();
  if (!expectedSecret || request.headers.get(INTERNAL_API_KEY_HEADER) !== expectedSecret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const settings = await getSystemSettings();
  return NextResponse.json(settings.security.headers);
}
