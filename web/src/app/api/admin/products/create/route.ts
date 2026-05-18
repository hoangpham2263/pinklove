import { requireAdmin } from "@/lib/auth";
import { createProduct } from "@/features/products/server/service";
import { ensureBuilderDocument } from "@/features/invitations/builder/utils";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";
import {
  getInvitationTemplateDefaults,
  getInvitationTemplateProductType,
} from "@/features/invitations/templates/registry";
import type { ProductFulfillmentType, ProductOwnerType, ProductType } from "@/features/products/types";

export const runtime = "nodejs";
const BUILDER_TEMPLATE_KEY = "freeform_sections";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "");
  const description = String(formData.get("description") ?? "");
  const status = String(formData.get("status") ?? "draft") as "draft" | "published";
  const productType = String(formData.get("productType") ?? "coded_template") as ProductType;
  const submittedTemplateKey = String(formData.get("templateKey") ?? "").trim();
  const templateKey = productType === "builder_template" ? BUILDER_TEMPLATE_KEY : submittedTemplateKey;
  const thumbnailUrl = String(formData.get("thumbnailUrl") ?? "").trim();
  const price = Number(formData.get("price") ?? "0");
  const fulfillmentType = String(formData.get("fulfillmentType") ?? "digital") as ProductFulfillmentType;
  const supportsInventory = productType === "general_product";
  const trackInventory = supportsInventory && formData.get("trackInventory") === "on";
  const stockQuantity = supportsInventory ? Math.max(0, Number(formData.get("stockQuantity") ?? "0")) : 0;
  const lowStockThreshold = supportsInventory ? Math.max(0, Number(formData.get("lowStockThreshold") ?? "0")) : 0;
  const allowBackorder = supportsInventory && formData.get("allowBackorder") === "on";
  const costPrice = supportsInventory ? Math.max(0, Number(formData.get("costPrice") ?? "0")) : 0;
  const vendorSku = supportsInventory ? String(formData.get("vendorSku") ?? "").trim() : "";
  const ownerType = String(formData.get("ownerType") ?? "internal") === "vendor" ? "vendor" : "internal";
  const ownerVendorUserId = String(formData.get("ownerVendorUserId") ?? "").trim();
  const allowVendorSupply = productType === "general_product" && formData.get("allowVendorSupply") === "on";
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  const createBaseLocation =
    productType === "builder_template" ? ROUTES.ADMIN.BUILDER_CREATE : ROUTES.ADMIN.PRODUCTS;
  const createQuery = new URLSearchParams({
    ...(productType !== "builder_template" ? { type: productType } : {}),
    ...(returnTo ? { returnTo } : {}),
  }).toString();
  const createLocation = `${createBaseLocation}${createQuery ? `?${createQuery}` : ""}`;

  if (!["coded_template", "builder_template", "general_product"].includes(productType)) {
    return respondError(request, {
      error: "invalid_product_type",
      message: "Luồng tạo sản phẩm không hợp lệ.",
      location: returnTo || ROUTES.ADMIN.PRODUCT_LIST,
    });
  }

  if (productType === "coded_template") {
    return respondError(request, {
      error: "template_create_disabled",
      message: "Coded template là mẫu cố định theo code, không tạo mới từ trang admin này.",
      location: returnTo || ROUTES.ADMIN.PRODUCT_LIST,
    });
  }

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
  const builderDocumentRaw = String(formData.get("builderDocument") ?? "").trim();
  let builderDocument: unknown = null;

  if (productType === "builder_template" && builderDocumentRaw) {
    try {
      builderDocument = ensureBuilderDocument(JSON.parse(builderDocumentRaw));
    } catch {
      return respondError(request, {
        error: "invalid_builder_document",
        message: "Dữ liệu builder không hợp lệ.",
        location: `${createLocation}${createLocation.includes("?") ? "&" : "?"}error=invalid_builder_document`,
      });
    }
  }

  try {
    const product = await createProduct({
      slug,
      categoryId: categoryId || undefined,
      name,
      excerpt,
      description,
      productType,
      templateKey: resolvedTemplateKey,
      status,
      thumbnailUrl,
      price,
      fulfillmentType,
      trackInventory,
      stockQuantity,
      lowStockThreshold,
      allowBackorder,
      costPrice,
      vendorSku,
      config: {
        ...(productType === "general_product"
          ? {
              generalProduct: { ...ownerConfig, costPrice, vendorSku },
              vendorSupply: { enabled: allowVendorSupply },
            }
          : {
              siteDefaults: {
                ...getInvitationTemplateDefaults(templateKey),
                ...(builderDocument ? { builderDocument } : {}),
              },
            }),
      },
    });

    const nextLocation =
      product.productType === "builder_template"
        ? ROUTES.ADMIN.BUILDER_EDITOR(product.slug)
        : product.productType === "coded_template"
          ? ROUTES.ADMIN.CODED_TEMPLATE(product.slug)
        : ROUTES.ADMIN.PRODUCT(product.slug);

    return respondSuccess(request, {
      location: `${nextLocation}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`,
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
