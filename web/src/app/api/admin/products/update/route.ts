import { requireAdmin } from "@/lib/auth";
import { updateProduct } from "@/features/products/server/service";
import { ROUTES } from "@/lib/routes";
import { getInvitationTemplateProductType } from "@/features/invitations/templates/registry";
import type { ProductType } from "@/features/products/types";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const originalSlug = String(formData.get("originalSlug") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "");
  const description = String(formData.get("description") ?? "");
  const status = String(formData.get("status") ?? "draft") as "draft" | "published";
  const productType = String(formData.get("productType") ?? "coded_template") as ProductType;
  const templateKey = String(formData.get("templateKey") ?? "").trim();
  const thumbnailUrl = String(formData.get("thumbnailUrl") ?? "").trim();
  const price = Number(formData.get("price") ?? "0");
  const siteDefaultsRaw = String(formData.get("siteDefaults") ?? "{}");

  if (!originalSlug || !slug || !name || !templateKey) {
    return respondError(request, { error: "missing_fields", message: "Thiếu thông tin bắt buộc để lưu sản phẩm.", location: `${ROUTES.ADMIN.PRODUCT(originalSlug)}?error=missing_fields` });
  }

  if (getInvitationTemplateProductType(templateKey) !== productType) {
    return respondError(request, { error: "invalid_template", message: "Template không khớp với loại sản phẩm.", location: `${ROUTES.ADMIN.PRODUCT(originalSlug)}?error=invalid_template` });
  }

  const siteDefaults = JSON.parse(siteDefaultsRaw) as Record<string, unknown>;
  const product = await updateProduct(originalSlug, {
    slug,
    categoryId: categoryId || undefined,
    name,
    excerpt,
    description,
    status,
    productType,
    templateKey,
    thumbnailUrl,
    price,
    config: {
      siteDefaults,
    },
  });

  if (!product) {
    return respondError(request, { error: "product_not_found", message: "Không tìm thấy sản phẩm.", location: `${ROUTES.ADMIN.PRODUCT_LIST}?error=product_not_found` });
  }

  return respondSuccess(request, { location: `${ROUTES.ADMIN.PRODUCT(product.slug)}`, message: "Đã lưu sản phẩm." });
}
