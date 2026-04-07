import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { buildWeddingSitePayload, updateWeddingSiteForUser } from "@/features/sites/server/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const formData = await request.formData();
  const siteId = Number(formData.get("siteId") ?? "0");
  const title = String(formData.get("title") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const status = String(formData.get("status") ?? "draft") as "draft" | "published";
  const templateKey = String(formData.get("templateKey") ?? "");

  if (!siteId || !title) {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: `${ROUTES.USER.SITES}/${siteId}?error=missing_fields` },
    });
  }

  const site = await updateWeddingSiteForUser({
    userId: user.id,
    siteId,
    title,
    slug,
    status,
    customData: buildWeddingSitePayload(formData, templateKey),
  });

  if (!site) {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: `${ROUTES.USER.SITES}?error=site_not_found` },
    });
  }

  const nextLocation = site.siteType === "builder_template"
    ? `${ROUTES.USER.DESIGN(site.id)}?saved=1`
    : `${ROUTES.USER.SITES}/${site.id}?saved=1`;

  return new NextResponse(null, {
    status: 303,
    headers: { Location: nextLocation },
  });
}
