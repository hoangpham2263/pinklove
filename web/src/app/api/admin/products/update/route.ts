import { requireAdmin } from "@/lib/auth";
import { updateProduct } from "@/features/products/server/service";
import { ROUTES } from "@/lib/routes";
import { getInvitationTemplateProductType } from "@/features/invitations/templates/registry";
import type { ProductFulfillmentType, ProductOwnerType, ProductType } from "@/features/products/types";
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
  const fulfillmentType = String(formData.get("fulfillmentType") ?? "digital") as ProductFulfillmentType;
  const templateKey = String(formData.get("templateKey") ?? "").trim();
  const thumbnailUrl = String(formData.get("thumbnailUrl") ?? "").trim();
  const price = Number(formData.get("price") ?? "0");
  const trackInventory = formData.get("trackInventory") === "on";
  const stockQuantity = Math.max(0, Number(formData.get("stockQuantity") ?? "0"));
  const lowStockThreshold = Math.max(0, Number(formData.get("lowStockThreshold") ?? "0"));
  const allowBackorder = formData.get("allowBackorder") === "on";
  const siteDefaultsRaw = String(formData.get("siteDefaults") ?? "{}");
  const ownerType = String(formData.get("ownerType") ?? "internal") === "vendor" ? "vendor" : "internal";
  const ownerVendorUserId = String(formData.get("ownerVendorUserId") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  const editorLocation = `${ROUTES.ADMIN.PRODUCT(originalSlug)}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`;

  if (!originalSlug || !slug || !name || (productType !== "general_product" && !templateKey)) {
    return respondError(request, { error: "missing_fields", message: "Thiếu thông tin bắt buộc để lưu sản phẩm.", location: `${editorLocation}${editorLocation.includes("?") ? "&" : "?"}error=missing_fields` });
  }

  if (productType !== "general_product" && getInvitationTemplateProductType(templateKey) !== productType) {
    return respondError(request, { error: "invalid_template", message: "Template không khớp với loại sản phẩm.", location: `${editorLocation}${editorLocation.includes("?") ? "&" : "?"}error=invalid_template` });
  }

  if (ownerType === "vendor" && !ownerVendorUserId) {
    return respondError(request, { error: "missing_vendor", message: "Hãy chọn đối tác sở hữu nguồn hàng cho sản phẩm này.", location: `${editorLocation}${editorLocation.includes("?") ? "&" : "?"}error=missing_vendor` });
  }

  const siteDefaults = JSON.parse(siteDefaultsRaw) as Record<string, unknown>;
  const resolvedTemplateKey = productType === "general_product" ? "general_product" : templateKey;
  const ownerConfig = {
    ownerType: ownerType as ProductOwnerType,
    vendorUserId: ownerType === "vendor" ? ownerVendorUserId : undefined,
  };
  let product = null;

  try {
    product = await updateProduct(originalSlug, {
      slug,
      categoryId: categoryId || undefined,
      name,
      excerpt,
      description,
      status,
      productType,
      fulfillmentType,
      templateKey: resolvedTemplateKey,
      thumbnailUrl,
      price,
      trackInventory,
      stockQuantity,
      lowStockThreshold,
      allowBackorder,
      config: {
        ...(productType === "general_product"
          ? { generalProduct: ownerConfig }
          : { siteDefaults }),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_TEMPLATE_KEY_IN_USE") {
      return respondError(request, {
        error: "template_in_use",
        message: "Template này đã có một sản phẩm gốc khác sử dụng.",
        location: `${editorLocation}${editorLocation.includes("?") ? "&" : "?"}error=template_in_use`,
      });
    }

    throw error;
  }

  if (!product) {
    return respondError(request, { error: "product_not_found", message: "Không tìm thấy sản phẩm.", location: `${ROUTES.ADMIN.PRODUCT_LIST}?error=product_not_found` });
  }

  return respondSuccess(request, {
    location: `${ROUTES.ADMIN.PRODUCT(product.slug)}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`,
    message: "Đã lưu sản phẩm.",
  });
}
