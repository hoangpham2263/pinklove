import { NextResponse } from "next/server";
import {
  AFFILIATE_COOKIE_MAX_AGE,
  AFFILIATE_REF_COOKIE_NAME,
  AFFILIATE_VISITOR_COOKIE_NAME,
  recordAffiliateClick,
} from "@/features/affiliate/server/service";
import { getCurrentUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

type TrackPayload = {
  code?: string;
  landingPath?: string;
};

export async function POST(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  const payload = (await request.json().catch(() => null)) as TrackPayload | null;
  const code = payload?.code?.trim().toLowerCase();
  const landingPath = payload?.landingPath?.trim() || "/";

  if (!code) {
    return NextResponse.json({ ok: false, error: "missing_code" }, { status: 400 });
  }

  const visitorToken =
    request.headers
      .get("cookie")
      ?.split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${AFFILIATE_VISITOR_COOKIE_NAME}=`))
      ?.split("=")[1] || undefined;

  const tracked = await recordAffiliateClick({
    code,
    landingPath,
    referrer: request.headers.get("referer") || undefined,
    userAgent: request.headers.get("user-agent") || undefined,
    visitorToken,
    excludeUserId: user?.id,
  });

  if (!tracked) {
    return NextResponse.json({ ok: false, error: "affiliate_not_available" }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AFFILIATE_REF_COOKIE_NAME, tracked.account.code, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: AFFILIATE_COOKIE_MAX_AGE,
  });
  response.cookies.set(AFFILIATE_VISITOR_COOKIE_NAME, tracked.visitorToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: AFFILIATE_COOKIE_MAX_AGE,
  });

  return response;
}
