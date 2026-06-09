import { requireAdmin } from "@/lib/auth";
import { getOfferingBySlug, getOfferingTypeByKey, updateOffering, validateOfferingCustomFields } from "@/features/offerings/server/service";
import { ensureBuilderDocument } from "@/features/invitations/builder/utils";
import { ROUTES } from "@/lib/routes";
import { getInvitationTemplateEngine } from "@/features/invitations/templates/registry";
import {
  BUILDER_TEMPLATE_KEY,
  PHYSICAL_PRODUCT_TEMPLATE_KEY,
  SYSTEM_OFFERING_TYPES,
  SYSTEM_TEMPLATE_ENGINES,
  SYSTEM_TEMPLATE_MODES,
  type OfferingFulfillmentType,
  type OfferingStatus,
  type OfferingTemplateEngine,
  type OfferingTemplateMode,
  type OfferingType,
} from "@/features/offerings/types";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();

  const formData = await request.formData();
  const originalSlug = String(formData.get("originalSlug") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "");
  const description = String(formData.get("description") ?? "");
  const status = String(formData.get("status") ?? "draft") as OfferingStatus;
  const requestedOfferingType = String(formData.get("offeringType") ?? SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE) as OfferingType;
  const templateEngineInput = String(formData.get("templateEngine") ?? "").trim() as OfferingTemplateEngine | "";
  const offeringType = requestedOfferingType;
  const templateEngine: OfferingTemplateEngine | undefined =
    offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE ? templateEngineInput || SYSTEM_TEMPLATE_ENGINES.CODED : undefined;
  const templateMode: OfferingTemplateMode | undefined =
    templateEngine === SYSTEM_TEMPLATE_ENGINES.BUILDER
      ? SYSTEM_TEMPLATE_MODES.EDITABLE
      : templateEngine
        ? SYSTEM_TEMPLATE_MODES.FIXED
        : undefined;
  const fulfillmentType = String(formData.get("fulfillmentType") ?? "digital") as OfferingFulfillmentType;
  const submittedTemplateKey = String(formData.get("templateKey") ?? "").trim();
  const templateKey = templateEngine === SYSTEM_TEMPLATE_ENGINES.BUILDER ? BUILDER_TEMPLATE_KEY : submittedTemplateKey;
  const thumbnailUrl = String(formData.get("thumbnailUrl") ?? "").trim();
  const price = Number(formData.get("price") ?? "0");
  const offeringTypeDefinition = await getOfferingTypeByKey(offeringType);
  const supportsInventory = offeringTypeDefinition?.supportsInventory ?? offeringType === SYSTEM_OFFERING_TYPES.PHYSICAL_PRODUCT;
  const supportsProviderSupply = offeringTypeDefinition?.supportsProviderSupply ?? offeringType === SYSTEM_OFFERING_TYPES.PHYSICAL_PRODUCT;
  const supportsSupplyDetails = supportsInventory || supportsProviderSupply;
  const trackInventory = supportsInventory && formData.get("trackInventory") === "on";
  const stockQuantity = supportsInventory ? Math.max(0, Number(formData.get("stockQuantity") ?? "0")) : 0;
  const lowStockThreshold = supportsInventory ? Math.max(0, Number(formData.get("lowStockThreshold") ?? "0")) : 0;
  const allowBackorder = supportsInventory && formData.get("allowBackorder") === "on";
  const costPrice = supportsSupplyDetails ? Math.max(0, Number(formData.get("costPrice") ?? "0")) : 0;
  const providerSku = supportsSupplyDetails ? String(formData.get("providerSku") ?? "").trim() : "";
  const siteDefaultsRaw = String(formData.get("siteDefaults") ?? "{}");
  const ownerType = String(formData.get("ownerType") ?? "internal") === "provider" ? "provider" : "internal";
  const ownerProviderId = String(formData.get("ownerProviderId") ?? "").trim();
  const allowProviderSupply = supportsProviderSupply && formData.get("allowProviderSupply") === "on";
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  const editorBaseLocation =
    templateEngine === SYSTEM_TEMPLATE_ENGINES.BUILDER
      ? ROUTES.ADMIN.OFFERING_BUILDER_EDITOR(originalSlug)
      : offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE
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

  if (!originalSlug || !slug || !name || !templateKey) {
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

  if (templateEngine === SYSTEM_TEMPLATE_ENGINES.BUILDER && getInvitationTemplateEngine(templateKey) !== SYSTEM_TEMPLATE_ENGINES.BUILDER) {
    return respondError(request, { error: "invalid_template", message: "Template không khớp với loại sản phẩm.", location: `${editorLocation}${editorLocation.includes("?") ? "&" : "?"}error=invalid_template` });
  }

  if (offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE && existingOffering.templateEngine === SYSTEM_TEMPLATE_ENGINES.CODED && templateKey !== existingOffering.templateKey) {
    return respondError(request, {
      error: "template_source_locked",
      message: "Template source của bản mẫu chuẩn đã bị khóa, chỉ cho phép chỉnh nội dung và trạng thái.",
      location: `${editorLocation}${editorLocation.includes("?") ? "&" : "?"}error=template_source_locked`,
    });
  }

  if (offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE && fulfillmentType !== existingOffering.fulfillmentType) {
    return respondError(request, {
      error: "fulfillment_locked",
      message: "Hình thức bàn giao của mẫu chuẩn đã bị khóa.",
      location: `${editorLocation}${editorLocation.includes("?") ? "&" : "?"}error=fulfillment_locked`,
    });
  }

  if (ownerType === "provider" && !ownerProviderId) {
    return respondError(request, { error: "missing_provider", message: "Hãy chọn provider sở hữu nguồn cung ứng cho dịch vụ/sản phẩm này.", location: `${editorLocation}${editorLocation.includes("?") ? "&" : "?"}error=missing_provider` });
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

  const crossSellsRaw = formData.getAll("crossSells");
  const crossSells = crossSellsRaw.map((v) => String(v)).filter(Boolean);

  const upsellsRaw = formData.getAll("upsells");
  const upsells = upsellsRaw.map((v) => String(v)).filter(Boolean);

  if (templateEngine === SYSTEM_TEMPLATE_ENGINES.BUILDER && builderDocumentRaw) {
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
    templateEngine === SYSTEM_TEMPLATE_ENGINES.BUILDER
      ? {
          ...siteDefaults,
          ...(builderDocument ? { builderDocument } : {}),
        }
      : siteDefaults;
  const resolvedTemplateKey =
    offeringType === SYSTEM_OFFERING_TYPES.PHYSICAL_PRODUCT
      ? PHYSICAL_PRODUCT_TEMPLATE_KEY
      : offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE
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
      providerSku,
      allowProviderSupply,
      ownerType,
      ownerProviderId: ownerType === "provider" ? ownerProviderId : undefined,
      actorId: admin.id,
      config: {
        customFields,
        ...(!supportsInventory && offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE ? { siteDefaults: normalizedSiteDefaults } : {}),
      },
      crossSells,
      upsells,
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
    offering.offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE && offering.templateEngine === SYSTEM_TEMPLATE_ENGINES.BUILDER
      ? ROUTES.ADMIN.OFFERING_BUILDER_EDITOR(offering.slug)
      : offering.offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE
        ? ROUTES.ADMIN.OFFERING_TEMPLATE(offering.slug)
      : ROUTES.ADMIN.OFFERING(offering.slug);

  return respondSuccess(request, {
    location: `${nextLocation}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`,
    message: "Đã lưu sản phẩm.",
  });
}
