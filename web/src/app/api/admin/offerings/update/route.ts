import { requireAdmin } from "@/lib/auth";
import { getOfferingBySlug, getOfferingTypeByKey, updateOffering, validateOfferingCustomFields } from "@/features/offerings/server/service";
import { ensureBuilderDocument } from "@/features/invitations/builder/utils";
import { ROUTES } from "@/lib/routes";
import { getInvitationTemplateEngine } from "@/features/invitations/templates/registry";
import type { OfferingFulfillmentType, OfferingTemplateEngine, OfferingTemplateMode, OfferingType } from "@/features/offerings/types";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";
const BUILDER_KEY = "freeform_sections";

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
  const requestedOfferingType = String(formData.get("offeringType") ?? "digital_template") as OfferingType;
  const templateEngineInput = String(formData.get("templateEngine") ?? "").trim() as OfferingTemplateEngine | "";
  const offeringType = requestedOfferingType;
  const templateEngine: OfferingTemplateEngine | undefined =
    offeringType === "digital_template" ? templateEngineInput || "coded" : undefined;
  const templateMode: OfferingTemplateMode | undefined = templateEngine === "builder" ? "editable" : templateEngine ? "fixed" : undefined;
  const fulfillmentType = String(formData.get("fulfillmentType") ?? "digital") as OfferingFulfillmentType;
  const submittedTemplateKey = String(formData.get("templateKey") ?? "").trim();
  const templateKey = templateEngine === "builder" ? BUILDER_KEY : submittedTemplateKey;
  const thumbnailUrl = String(formData.get("thumbnailUrl") ?? "").trim();
  const price = Number(formData.get("price") ?? "0");
  const offeringTypeDefinition = await getOfferingTypeByKey(offeringType);
  const supportsInventory = offeringTypeDefinition?.supportsInventory ?? offeringType === "physical_product";
  const trackInventory = supportsInventory && formData.get("trackInventory") === "on";
  const stockQuantity = supportsInventory ? Math.max(0, Number(formData.get("stockQuantity") ?? "0")) : 0;
  const lowStockThreshold = supportsInventory ? Math.max(0, Number(formData.get("lowStockThreshold") ?? "0")) : 0;
  const allowBackorder = supportsInventory && formData.get("allowBackorder") === "on";
  const costPrice = supportsInventory ? Math.max(0, Number(formData.get("costPrice") ?? "0")) : 0;
  const vendorSku = supportsInventory ? String(formData.get("vendorSku") ?? "").trim() : "";
  const siteDefaultsRaw = String(formData.get("siteDefaults") ?? "{}");
  const ownerType = String(formData.get("ownerType") ?? "internal") === "vendor" ? "vendor" : "internal";
  const ownerVendorUserId = String(formData.get("ownerVendorUserId") ?? "").trim();
  const allowVendorSupply = (offeringTypeDefinition?.supportsVendorSupply ?? offeringType === "physical_product") && formData.get("allowVendorSupply") === "on";
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  const editorBaseLocation =
    templateEngine === "builder"
      ? ROUTES.ADMIN.OFFERING_BUILDER_EDITOR(originalSlug)
      : offeringType === "digital_template"
        ? ROUTES.ADMIN.OFFERING_TEMPLATE(originalSlug)
      : ROUTES.ADMIN.OFFERING(originalSlug);
  const editorLocation = `${editorBaseLocation}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`;

  if (!offeringTypeDefinition) {
    return respondError(request, {
      error: "invalid_offering_type",
      message: "Luồng sửa sản phẩm không hợp lệ.",
      location: returnTo || ROUTES.ADMIN.OFFERING_LIST,
    });
  }

  if (!originalSlug || !slug || !name || (offeringType === "digital_template" && !templateKey)) {
    return respondError(request, { error: "missing_fields", message: "Thiếu thông tin bắt buộc để lưu sản phẩm.", location: `${editorLocation}${editorLocation.includes("?") ? "&" : "?"}error=missing_fields` });
  }

  const existingOffering = await getOfferingBySlug(originalSlug);

  if (!existingOffering) {
    return respondError(request, { error: "offering_not_found", message: "Không tìm thấy sản phẩm.", location: `${ROUTES.ADMIN.OFFERING_LIST}?error=offering_not_found` });
  }

  if (offeringType !== existingOffering.offeringType) {
    return respondError(request, {
      error: "offering_type_locked",
      message: "Loại sản phẩm đã được cố định theo bản ghi gốc và không thể đổi trong màn hình sửa.",
      location: `${editorLocation}${editorLocation.includes("?") ? "&" : "?"}error=offering_type_locked`,
    });
  }

  if (templateEngine === "builder" && getInvitationTemplateEngine(templateKey) !== "builder") {
    return respondError(request, { error: "invalid_template", message: "Template không khớp với loại sản phẩm.", location: `${editorLocation}${editorLocation.includes("?") ? "&" : "?"}error=invalid_template` });
  }

  if (offeringType === "digital_template" && existingOffering.templateEngine === "coded" && templateKey !== existingOffering.templateKey) {
    return respondError(request, {
      error: "template_source_locked",
      message: "Template source của bản mẫu chuẩn đã bị khóa, chỉ cho phép chỉnh nội dung và trạng thái.",
      location: `${editorLocation}${editorLocation.includes("?") ? "&" : "?"}error=template_source_locked`,
    });
  }

  if (offeringType === "digital_template" && fulfillmentType !== existingOffering.fulfillmentType) {
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

  if (templateEngine === "builder" && builderDocumentRaw) {
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
    templateEngine === "builder"
      ? {
          ...siteDefaults,
          ...(builderDocument ? { builderDocument } : {}),
        }
      : siteDefaults;
  const resolvedTemplateKey =
    offeringType === "physical_product"
      ? "physical_product"
      : offeringType === "digital_template"
        ? templateKey
        : offeringTypeDefinition.templateKey || offeringType;
  const customFieldsRaw = String(formData.get("customFields") ?? JSON.stringify(existingOffering.config.customFields ?? {}));
  let customFields: Record<string, unknown> = {};
  try {
    customFields = JSON.parse(customFieldsRaw) as Record<string, unknown>;
    customFields = await validateOfferingCustomFields({
      offeringTypeDefinition,
      values: customFields,
      excludeOfferingId: existingOffering.id,
    });
  } catch {
    return respondError(request, {
      error: "invalid_custom_fields",
      message: "Dữ liệu fields của loại sản phẩm không hợp lệ hoặc thiếu field bắt buộc.",
      location: `${editorLocation}${editorLocation.includes("?") ? "&" : "?"}error=invalid_custom_fields`,
    });
  }
  let offering = null;

  try {
    offering = await updateOffering(originalSlug, {
      slug,
      categoryId: categoryId || undefined,
      name,
      excerpt,
      description,
      status,
      offeringType,
      templateEngine,
      templateMode,
      fulfillmentType,
      templateKey: resolvedTemplateKey,
      thumbnailUrl,
      price,
      trackInventory,
      stockQuantity,
      lowStockThreshold,
      allowBackorder,
      costPrice,
      vendorSku,
      allowVendorSupply,
      ownerType,
      ownerVendorUserId: ownerType === "vendor" ? ownerVendorUserId : undefined,
      config: {
        customFields,
        ...(!supportsInventory && offeringType === "digital_template" ? { siteDefaults: normalizedSiteDefaults } : {}),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "OFFERING_TEMPLATE_KEY_IN_USE") {
      return respondError(request, {
        error: "template_in_use",
        message: "Template này đã có một sản phẩm gốc khác sử dụng.",
        location: `${editorLocation}${editorLocation.includes("?") ? "&" : "?"}error=template_in_use`,
      });
    }
    if (error instanceof Error && error.message === "OFFERING_TYPE_LOCKED") {
      return respondError(request, {
        error: "offering_type_locked",
        message: "Loại sản phẩm đã được cố định theo bản ghi gốc và không thể đổi.",
        location: `${editorLocation}${editorLocation.includes("?") ? "&" : "?"}error=offering_type_locked`,
      });
    }

    throw error;
  }

  if (!offering) {
    return respondError(request, { error: "offering_not_found", message: "Không tìm thấy sản phẩm.", location: `${ROUTES.ADMIN.OFFERING_LIST}?error=offering_not_found` });
  }

  const nextLocation =
    offering.offeringType === "digital_template" && offering.templateEngine === "builder"
      ? ROUTES.ADMIN.OFFERING_BUILDER_EDITOR(offering.slug)
      : offering.offeringType === "digital_template"
        ? ROUTES.ADMIN.OFFERING_TEMPLATE(offering.slug)
      : ROUTES.ADMIN.OFFERING(offering.slug);

  return respondSuccess(request, {
    location: `${nextLocation}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`,
    message: "Đã lưu sản phẩm.",
  });
}
