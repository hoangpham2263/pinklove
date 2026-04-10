import { requireAdmin } from "@/lib/auth";
import { createProduct } from "@/features/products/server/service";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";
import {
  getInvitationTemplateDefaults,
  getInvitationTemplateProductType,
} from "@/features/invitations/templates/registry";
import type { ProductType } from "@/features/products/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const productType = String(formData.get("productType") ?? "coded_template") as ProductType;
  const templateKey = String(formData.get("templateKey") ?? "").trim();

  if (!name || !slug || !templateKey) {
    return respondError(request, { error: "missing_fields", message: "Thiếu thông tin bắt buộc để tạo sản phẩm.", location: `${ROUTES.ADMIN.PRODUCTS}?error=missing_fields` });
  }

  if (getInvitationTemplateProductType(templateKey) !== productType) {
    return respondError(request, { error: "invalid_template", message: "Template không khớp với loại sản phẩm.", location: `${ROUTES.ADMIN.PRODUCTS}?error=invalid_template` });
  }

  try {
    const product = await createProduct({
      slug,
      categoryId: categoryId || undefined,
      name,
      productType,
      templateKey,
      status: "draft",
      config: {
        siteDefaults: getInvitationTemplateDefaults(templateKey),
      },
    });

    return respondSuccess(request, { location: ROUTES.ADMIN.PRODUCT(product.slug), message: "Đã tạo sản phẩm mới." });
  } catch (error) {
    console.error("Failed to create product:", error);
    return respondError(request, { error: "create_failed", message: "Không thể tạo sản phẩm.", location: `${ROUTES.ADMIN.PRODUCTS}?error=create_failed` });
  }
}
