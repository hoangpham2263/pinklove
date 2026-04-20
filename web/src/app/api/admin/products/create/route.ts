import { requireAdmin } from "@/lib/auth";
import { createProduct } from "@/features/products/server/service";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";
import {
  getInvitationTemplateDefaults,
  getInvitationTemplateProductType,
} from "@/features/invitations/templates/registry";
import type { ProductFulfillmentType, ProductOwnerType, ProductType } from "@/features/products/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const status = String(formData.get("status") ?? "draft") as "draft" | "published";
  const productType = String(formData.get("productType") ?? "coded_template") as ProductType;
  const templateKey = String(formData.get("templateKey") ?? "").trim();
  const fulfillmentType = String(formData.get("fulfillmentType") ?? "digital") as ProductFulfillmentType;
  const trackInventory = formData.get("trackInventory") === "on";
  const stockQuantity = Math.max(0, Number(formData.get("stockQuantity") ?? "0"));
  const lowStockThreshold = Math.max(0, Number(formData.get("lowStockThreshold") ?? "0"));
  const allowBackorder = formData.get("allowBackorder") === "on";
  const ownerType = String(formData.get("ownerType") ?? "internal") === "vendor" ? "vendor" : "internal";
  const ownerVendorUserId = String(formData.get("ownerVendorUserId") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  const createLocation = `${ROUTES.ADMIN.PRODUCTS}${returnTo || productType ? "?" : ""}${new URLSearchParams({
    ...(productType ? { type: productType } : {}),
    ...(returnTo ? { returnTo } : {}),
  }).toString()}`;

  if (!name || !slug || (productType !== "general_product" && !templateKey)) {
    return respondError(request, { error: "missing_fields", message: "Thiếu thông tin bắt buộc để tạo sản phẩm.", location: `${createLocation}${createLocation.includes("?") ? "&" : "?"}error=missing_fields` });
  }

  if (productType !== "general_product" && getInvitationTemplateProductType(templateKey) !== productType) {
    return respondError(request, { error: "invalid_template", message: "Template không khớp với loại sản phẩm.", location: `${createLocation}${createLocation.includes("?") ? "&" : "?"}error=invalid_template` });
  }

  if (ownerType === "vendor" && !ownerVendorUserId) {
    return respondError(request, { error: "missing_vendor", message: "Hãy chọn đối tác sở hữu nguồn hàng cho sản phẩm này.", location: `${createLocation}${createLocation.includes("?") ? "&" : "?"}error=missing_vendor` });
  }

  const resolvedTemplateKey = productType === "general_product" ? "general_product" : templateKey;
  const ownerConfig = {
    ownerType: ownerType as ProductOwnerType,
    vendorUserId: ownerType === "vendor" ? ownerVendorUserId : undefined,
  };

  try {
    const product = await createProduct({
      slug,
      categoryId: categoryId || undefined,
      name,
      productType,
      templateKey: resolvedTemplateKey,
      status,
      fulfillmentType,
      trackInventory,
      stockQuantity,
      lowStockThreshold,
      allowBackorder,
      config: {
        ...(productType === "general_product"
          ? { generalProduct: ownerConfig }
          : { siteDefaults: getInvitationTemplateDefaults(templateKey) }),
      },
    });

    return respondSuccess(request, {
      location: `${ROUTES.ADMIN.PRODUCT(product.slug)}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`,
      message: "Đã tạo sản phẩm mới.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_TEMPLATE_KEY_IN_USE") {
      return respondError(request, {
        error: "template_in_use",
        message: "Template này đã có một sản phẩm gốc khác sử dụng.",
        location: `${createLocation}${createLocation.includes("?") ? "&" : "?"}error=template_in_use`,
      });
    }

    console.error("Failed to create product:", error);
    return respondError(request, {
      error: "create_failed",
      message: "Không thể tạo sản phẩm.",
      location: `${createLocation}${createLocation.includes("?") ? "&" : "?"}error=create_failed`,
    });
  }
}
