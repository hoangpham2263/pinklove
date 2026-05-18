import { requireAppUser } from "@/lib/auth";
import { getProductBySlug } from "@/features/products/server/service";
import { ROUTES } from "@/lib/routes";
import { createInvitationFromProduct } from "@/features/invitations/server/service";
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
  const productSlug = String(formData.get("productSlug") ?? "");
  const product = await getProductBySlug(productSlug);

  if (!product || product.status !== "published") {
    return respondError(request, { error: "product_not_found", message: "Không tìm thấy template khả dụng.", location: `${ROUTES.TEMPLATES}?error=product_not_found` });
  }

  if (product.productType === "general_product") {
    return respondError(request, {
      error: "not_invitation_product",
      message: "Sản phẩm này không tạo thiệp web trong hệ thống.",
      location: ROUTES.WISHLIST,
    });
  }

  const customData: Record<string, unknown> = {
    ...collectFieldValues(getInvitationTemplateFields(product.templateKey), formData),
    ...(product.thumbnailUrl ? { previewImage: product.thumbnailUrl } : {}),
  };
  const brideName = String(customData.brideName ?? "").trim();
  const groomName = String(customData.groomName ?? "").trim();
  const title = [groomName, brideName].filter(Boolean).join(" & ") || product.name;

  const site = await createInvitationFromProduct({
    userId: user.id,
    product,
    title,
    customData,
  });

  const nextLocation =
    site.siteType === "builder"
      ? ROUTES.CUSTOMER.DESIGN(site.id)
      : `${ROUTES.CUSTOMER.INVITATIONS}/${site.id}`;

  return respondSuccess(request, { location: nextLocation, message: "Đã tạo thiệp mời từ template." });
}
