import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { applyForAffiliate } from "@/lib/affiliate";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const formData = await request.formData();
  const preferredCode = String(formData.get("preferredCode") ?? "");

  try {
    await applyForAffiliate({
      userId: user.id,
      username: user.username,
      preferredCode,
    });
    return new NextResponse(null, {
      status: 303,
      headers: { Location: `${ROUTES.USER.AFFILIATE}?saved=applied` },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "apply_failed";
    return new NextResponse(null, {
      status: 303,
      headers: { Location: `${ROUTES.USER.AFFILIATE}?error=${encodeURIComponent(code)}` },
    });
  }
}
