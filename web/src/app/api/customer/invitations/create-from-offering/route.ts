import { requireAppUser } from "@/lib/auth";
import { getOfferingBySlug } from "@/features/offerings/server/service";
import { ROUTES } from "@/lib/routes";
import { createInvitationFromOffering } from "@/features/invitations/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { getInvitationTemplateFields } from "@/features/invitations/templates/registry";
import type { FieldSchema } from "@/features/pages/schema";

export const runtime = "nodejs";

function collectFieldValues(fields: FieldSchema[], formData: FormData) {
  const values: Record<string, unknown> = {};

  for (const field of fields) {
    if (field.type === "section") {
      Object.assign(values, collectFieldValues(field.fields, formData));
      continue;
    }

    if (field.type === "repeater") {
      continue;
    }

    if (field.type === "media" && field.multiple) {
      values[field.name] = formData.getAll(field.name).map((item) => String(item).trim()).filter(Boolean);
      continue;
    }

    const value = String(formData.get(field.name) ?? "").trim();
    if (value) {
      values[field.name] = value;
    }
  }

  return values;
}

export async function POST(request: Request) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const formData = await request.formData();
  const offeringSlug = String(formData.get("offeringSlug") ?? "");
  const offering = await getOfferingBySlug(offeringSlug);

  if (!offering || offering.status !== "published") {
    return respondError(request, { error: "offering_not_found", message: "Không tìm thấy template khả dụng.", location: `${ROUTES.TEMPLATES}?error=offering_not_found` });
  }

  if (offering.offeringType === "general_offering") {
    return respondError(request, {
      error: "not_invitation_offering",
      message: "Sản phẩm này không tạo thiệp web trong hệ thống.",
      location: ROUTES.WISHLIST,
    });
  }

  const customData: Record<string, unknown> = {
    ...collectFieldValues(getInvitationTemplateFields(offering.templateKey), formData),
    ...(offering.thumbnailUrl ? { previewImage: offering.thumbnailUrl } : {}),
  };
  const brideName = String(customData.brideName ?? "").trim();
  const groomName = String(customData.groomName ?? "").trim();
  const title = [groomName, brideName].filter(Boolean).join(" & ") || offering.name;

  const site = await createInvitationFromOffering({
    userId: user.id,
    offering,
    title,
    customData,
  });

  const nextLocation =
    site.siteType === "builder"
      ? ROUTES.CUSTOMER.DESIGN(site.id)
      : `${ROUTES.CUSTOMER.INVITATIONS}/${site.id}`;

  return respondSuccess(request, { location: nextLocation, message: "Đã tạo thiệp mời từ template." });
}
