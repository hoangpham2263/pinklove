import { requireAdmin } from "@/lib/auth";
import { getProductBySlug, updateProduct } from "@/features/products/server/service";
import { ensureBuilderDocument } from "@/features/invitations/builder/utils";
import { ROUTES } from "@/lib/routes";
import { getInvitationTemplateProductType } from "@/features/invitations/templates/registry";
import type { ProductFulfillmentType, ProductOwnerType, ProductType } from "@/features/products/types";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";
const BUILDER_TEMPLATE_KEY = "freeform_sections";

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
  const submittedTemplateKey = String(formData.get("templateKey") ?? "").trim();
  const templateKey = productType === "builder_template" ? BUILDER_TEMPLATE_KEY : submittedTemplateKey;
  const thumbnailUrl = String(formData.get("thumbnailUrl") ?? "").trim();
  const price = Number(formData.get("price") ?? "0");
  const supportsInventory = productType === "general_product";
  const trackInventory = supportsInventory && formData.get("trackInventory") === "on";
  const stockQuantity = supportsInventory ? Math.max(0, Number(formData.get("stockQuantity") ?? "0")) : 0;
  const lowStockThreshold = supportsInventory ? Math.max(0, Number(formData.get("lowStockThreshold") ?? "0")) : 0;
  const allowBackorder = supportsInventory && formData.get("allowBackorder") === "on";
  const siteDefaultsRaw = String(formData.get("siteDefaults") ?? "{}");
  const ownerType = String(formData.get("ownerType") ?? "internal") === "vendor" ? "vendor" : "internal";
  const ownerVendorUserId = String(formData.get("ownerVendorUserId") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  const editorBaseLocation =
    productType === "builder_template"
      ? ROUTES.ADMIN.BUILDER_TEMPLATE_EDITOR(originalSlug)
      : ROUTES.ADMIN.PRODUCT(originalSlug);
  const editorLocation = `${editorBaseLocation}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`;

  if (!originalSlug || !slug || !name || (productType !== "general_product" && !templateKey)) {
    return respondError(request, { error: "missing_fields", message: "Thiếu thông tin bắt buộc để lưu sản phẩm.", location: `${editorLocation}${editorLocation.includes("?") ? "&" : "?"}error=missing_fields` });
  }

  const existingProduct = await getProductBySlug(originalSlug);

  if (!existingProduct) {
    return respondError(request, { error: "product_not_found", message: "Không tìm thấy sản phẩm.", location: `${ROUTES.ADMIN.PRODUCT_LIST}?error=product_not_found` });
  }

  if (productType !== existingProduct.productType) {
    return respondError(request, {
      error: "product_type_locked",
      message: "Loại sản phẩm đã được cố định theo bản ghi gốc và không thể đổi trong màn hình sửa.",
      location: `${editorLocation}${editorLocation.includes("?") ? "&" : "?"}error=product_type_locked`,
    });
  }

  if (productType !== "general_product" && getInvitationTemplateProductType(templateKey) !== productType) {
    return respondError(request, { error: "invalid_template", message: "Template không khớp với loại sản phẩm.", location: `${editorLocation}${editorLocation.includes("?") ? "&" : "?"}error=invalid_template` });
  }

  if (productType === "coded_template" && templateKey !== existingProduct.templateKey) {
    return respondError(request, {
      error: "template_source_locked",
      message: "Template source của bản mẫu chuẩn đã bị khóa, chỉ cho phép chỉnh nội dung và trạng thái.",
      location: `${editorLocation}${editorLocation.includes("?") ? "&" : "?"}error=template_source_locked`,
    });
  }

  if (productType !== "general_product" && fulfillmentType !== existingProduct.fulfillmentType) {
    return respondError(request, {
      error: "fulfillment_locked",
      message: "Hình thức bàn giao của mẫu chuẩn đã bị khóa.",
      location: `${editorLocation}${editorLocation.includes("?") ? "&" : "?"}error=fulfillment_locked`,
    });
  }

  if (ownerType === "vendor" && !ownerVendorUserId) {
    return respondError(request, { error: "missing_vendor", message: "Hãy chọn đối tác sở hữu nguồn hàng cho sản phẩm này.", location: `${editorLocation}${editorLocation.includes("?") ? "&" : "?"}error=missing_vendor` });
  }

  let siteDefaults: Record<string, unknown>;
  try {
    siteDefaults = JSON.parse(siteDefaultsRaw) as Record<string, unknown>;
  } catch {
    return respondError(request, {
      error: "invalid_site_defaults",
      message: "Dữ liệu mặc định không hợp lệ.",
      location: `${editorLocation}${editorLocation.includes("?") ? "&" : "?"}error=invalid_site_defaults`,
    });
  }

  const builderDocumentRaw = String(formData.get("builderDocument") ?? "").trim();
  let builderDocument: unknown = null;

  if (productType === "builder_template" && builderDocumentRaw) {
    try {
      builderDocument = ensureBuilderDocument(JSON.parse(builderDocumentRaw));
    } catch {
      return respondError(request, {
        error: "invalid_builder_document",
        message: "Dữ liệu builder không hợp lệ.",
        location: `${editorLocation}${editorLocation.includes("?") ? "&" : "?"}error=invalid_builder_document`,
      });
    }
  }

  const normalizedSiteDefaults =
    productType === "builder_template"
      ? {
          ...siteDefaults,
          ...(builderDocument ? { builderDocument } : {}),
        }
      : siteDefaults;
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
          : { siteDefaults: normalizedSiteDefaults }),
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

  const nextLocation =
    product.productType === "builder_template"
      ? ROUTES.ADMIN.BUILDER_TEMPLATE_EDITOR(product.slug)
      : ROUTES.ADMIN.PRODUCT(product.slug);

  return respondSuccess(request, {
    location: `${nextLocation}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`,
    message: "Đã lưu sản phẩm.",
  });
}
