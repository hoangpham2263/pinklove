import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { buildInvitationPayload, updateInvitationForUser } from "@/features/invitations/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const formData = await request.formData();
  const siteId = String(formData.get("siteId") ?? "");
  const title = String(formData.get("title") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const status = String(formData.get("status") ?? "draft") as "draft" | "published";
  const templateKey = String(formData.get("templateKey") ?? "");

  if (!siteId || !title) {
    return respondError(request, { error: "missing_fields", message: "Thiếu dữ liệu thiệp mời bắt buộc.", location: `${ROUTES.CUSTOMER.INVITATIONS}/${siteId}?error=missing_fields` });
  }

  const site = await updateInvitationForUser({
    userId: user.id,
    siteId,
    title,
    slug,
    status,
    customData: buildInvitationPayload(formData, templateKey),
  });

  if (!site) {
    return respondError(request, { error: "site_not_found", message: "Không tìm thấy thiệp mời.", location: `${ROUTES.CUSTOMER.INVITATIONS}?error=site_not_found` });
  }

  const nextLocation = site.siteType === "builder_template"
    ? `${ROUTES.CUSTOMER.DESIGN(site.id)}?saved=1`
    : `${ROUTES.CUSTOMER.INVITATIONS}/${site.id}?saved=1`;

  return respondSuccess(request, { location: nextLocation.replace(/\?saved=1$/, ""), message: "Đã lưu thiệp mời." });
}
