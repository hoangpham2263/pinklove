import { requireAdmin } from "@/lib/auth";
import { createOffering, getOfferingTypeByKey } from "@/features/offerings/server/service";
import { ensureBuilderDocument } from "@/features/invitations/builder/utils";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";
import {
  getInvitationTemplateDefaults,
  getInvitationTemplateOfferingType,
} from "@/features/invitations/templates/registry";
import type { OfferingFulfillmentType, OfferingOwnerType, OfferingType } from "@/features/offerings/types";

export const runtime = "nodejs";
const BUILDER_KEY = "freeform_sections";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "");
  const description = String(formData.get("description") ?? "");
  const status = String(formData.get("status") ?? "draft") as "draft" | "published";
  const offeringType = String(formData.get("offeringType") ?? "coded_template") as OfferingType;
  const submittedTemplateKey = String(formData.get("templateKey") ?? "").trim();
  const templateKey = offeringType === "builder" ? BUILDER_KEY : submittedTemplateKey;
  const thumbnailUrl = String(formData.get("thumbnailUrl") ?? "").trim();
  const price = Number(formData.get("price") ?? "0");
  const fulfillmentType = String(formData.get("fulfillmentType") ?? "digital") as OfferingFulfillmentType;
  const offeringTypeDefinition = await getOfferingTypeByKey(offeringType);
  const supportsInventory = offeringTypeDefinition?.supportsInventory ?? offeringType === "general_offering";
  const trackInventory = supportsInventory && formData.get("trackInventory") === "on";
  const stockQuantity = supportsInventory ? Math.max(0, Number(formData.get("stockQuantity") ?? "0")) : 0;
  const lowStockThreshold = supportsInventory ? Math.max(0, Number(formData.get("lowStockThreshold") ?? "0")) : 0;
  const allowBackorder = supportsInventory && formData.get("allowBackorder") === "on";
  const costPrice = supportsInventory ? Math.max(0, Number(formData.get("costPrice") ?? "0")) : 0;
  const vendorSku = supportsInventory ? String(formData.get("vendorSku") ?? "").trim() : "";
  const ownerType = String(formData.get("ownerType") ?? "internal") === "vendor" ? "vendor" : "internal";
  const ownerVendorUserId = String(formData.get("ownerVendorUserId") ?? "").trim();
  const allowVendorSupply = (offeringTypeDefinition?.supportsVendorSupply ?? offeringType === "general_offering") && formData.get("allowVendorSupply") === "on";
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  const createBaseLocation =
    offeringType === "builder" ? ROUTES.ADMIN.OFFERING_BUILDER_CREATE : ROUTES.ADMIN.OFFERINGS;
  const createQuery = new URLSearchParams({
    ...(offeringType !== "builder" ? { type: offeringType } : {}),
    ...(returnTo ? { returnTo } : {}),
  }).toString();
  const createLocation = `${createBaseLocation}${createQuery ? `?${createQuery}` : ""}`;

  if (!offeringTypeDefinition || offeringTypeDefinition.status !== "active") {
    return respondError(request, {
      error: "invalid_offering_type",
      message: "Luồng tạo sản phẩm không hợp lệ.",
      location: returnTo || ROUTES.ADMIN.OFFERING_LIST,
    });
  }

  if (offeringType === "coded_template") {
    return respondError(request, {
      error: "template_create_disabled",
      message: "Coded template là mẫu cố định theo code, không tạo mới từ trang admin này.",
      location: returnTo || ROUTES.ADMIN.OFFERING_LIST,
    });
  }

  if (!name || !slug || (!offeringTypeDefinition && offeringType !== "general_offering" && !templateKey)) {
    return respondError(request, { error: "missing_fields", message: "Thiếu thông tin bắt buộc để tạo sản phẩm.", location: `${createLocation}${createLocation.includes("?") ? "&" : "?"}error=missing_fields` });
  }

  if ((offeringType === "coded_template" || offeringType === "builder") && getInvitationTemplateOfferingType(templateKey) !== offeringType) {
    return respondError(request, { error: "invalid_template", message: "Template không khớp với loại sản phẩm.", location: `${createLocation}${createLocation.includes("?") ? "&" : "?"}error=invalid_template` });
  }

  if (ownerType === "vendor" && !ownerVendorUserId) {
    return respondError(request, { error: "missing_vendor", message: "Hãy chọn đối tác sở hữu nguồn hàng cho sản phẩm này.", location: `${createLocation}${createLocation.includes("?") ? "&" : "?"}error=missing_vendor` });
  }

  const resolvedTemplateKey =
    offeringType === "general_offering"
      ? "general_offering"
      : offeringType === "coded_template" || offeringType === "builder"
        ? templateKey
        : offeringTypeDefinition.templateKey || offeringType;
  const customFieldsRaw = String(formData.get("customFields") ?? "{}");
  let customFields: Record<string, unknown> = {};
  try {
    customFields = JSON.parse(customFieldsRaw) as Record<string, unknown>;
  } catch {
    return respondError(request, {
      error: "invalid_custom_fields",
      message: "Dữ liệu fields của loại sản phẩm không hợp lệ.",
      location: `${createLocation}${createLocation.includes("?") ? "&" : "?"}error=invalid_custom_fields`,
    });
  }
  const ownerConfig = {
    ownerType: ownerType as OfferingOwnerType,
    vendorUserId: ownerType === "vendor" ? ownerVendorUserId : undefined,
  };
  const builderDocumentRaw = String(formData.get("builderDocument") ?? "").trim();
  let builderDocument: unknown = null;

  if (offeringType === "builder" && builderDocumentRaw) {
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
    const offering = await createOffering({
      slug,
      categoryId: categoryId || undefined,
      name,
      excerpt,
      description,
      offeringType,
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
        offeringTypeDefinition: {
          key: offeringTypeDefinition.key,
          label: offeringTypeDefinition.label,
          fieldSchema: offeringTypeDefinition.fieldSchema,
        },
        customFields,
        ...(supportsInventory
          ? {
              generalOffering: { ...ownerConfig, costPrice, vendorSku },
              vendorSupply: { enabled: allowVendorSupply },
            }
          : offeringType === "coded_template" || offeringType === "builder"
            ? {
              siteDefaults: {
                ...getInvitationTemplateDefaults(templateKey),
                ...(builderDocument ? { builderDocument } : {}),
              },
            }
            : {}),
      },
    });

    const nextLocation =
      offering.offeringType === "builder"
        ? ROUTES.ADMIN.OFFERING_BUILDER_EDITOR(offering.slug)
        : offering.offeringType === "coded_template"
          ? ROUTES.ADMIN.OFFERING_TEMPLATE(offering.slug)
        : ROUTES.ADMIN.OFFERING(offering.slug);

    return respondSuccess(request, {
      location: `${nextLocation}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`,
      message: "Đã tạo sản phẩm mới.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "OFFERING_TEMPLATE_KEY_IN_USE") {
      return respondError(request, {
        error: "template_in_use",
        message: "Template này đã có một sản phẩm gốc khác sử dụng.",
        location: `${createLocation}${createLocation.includes("?") ? "&" : "?"}error=template_in_use`,
      });
    }

    console.error("Failed to create offering:", error);
    return respondError(request, {
      error: "create_failed",
      message: "Không thể tạo sản phẩm.",
      location: `${createLocation}${createLocation.includes("?") ? "&" : "?"}error=create_failed`,
    });
  }
}
