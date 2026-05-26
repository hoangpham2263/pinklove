import { requireAdmin } from "@/lib/auth";
import { createOffering, getOfferingTypeByKey, validateOfferingCustomFields } from "@/features/offerings/server/service";
import { ensureBuilderDocument } from "@/features/invitations/builder/utils";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";
import {
  getInvitationTemplateDefaults,
  getInvitationTemplateEngine,
} from "@/features/invitations/templates/registry";
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

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "");
  const description = String(formData.get("description") ?? "");
  const status = String(formData.get("status") ?? "draft") as OfferingStatus;
  const requestedOfferingType = String(formData.get("offeringType") ?? SYSTEM_OFFERING_TYPES.PHYSICAL_PRODUCT) as OfferingType;
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
  const submittedTemplateKey = String(formData.get("templateKey") ?? "").trim();
  const templateKey = templateEngine === SYSTEM_TEMPLATE_ENGINES.BUILDER ? BUILDER_TEMPLATE_KEY : submittedTemplateKey;
  const thumbnailUrl = String(formData.get("thumbnailUrl") ?? "").trim();
  const price = Number(formData.get("price") ?? "0");
  const fulfillmentType = String(formData.get("fulfillmentType") ?? "digital") as OfferingFulfillmentType;
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
  const ownerType = String(formData.get("ownerType") ?? "internal") === "provider" ? "provider" : "internal";
  const ownerProviderId = String(formData.get("ownerProviderId") ?? "").trim();
  const allowProviderSupply = supportsProviderSupply && formData.get("allowProviderSupply") === "on";
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  const createBaseLocation =
    templateEngine === SYSTEM_TEMPLATE_ENGINES.BUILDER ? ROUTES.ADMIN.OFFERING_BUILDER_CREATE : ROUTES.ADMIN.OFFERINGS;
  const createQuery = new URLSearchParams({
    ...(templateEngine !== SYSTEM_TEMPLATE_ENGINES.BUILDER ? { type: offeringType } : {}),
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

  if (!name || !slug || !templateKey) {
    return respondError(request, { error: "missing_fields", message: "Thiếu thông tin bắt buộc để tạo sản phẩm.", location: `${createLocation}${createLocation.includes("?") ? "&" : "?"}error=missing_fields` });
  }

  if (templateEngine === SYSTEM_TEMPLATE_ENGINES.BUILDER && getInvitationTemplateEngine(templateKey) !== SYSTEM_TEMPLATE_ENGINES.BUILDER) {
    return respondError(request, { error: "invalid_template", message: "Template không khớp với loại sản phẩm.", location: `${createLocation}${createLocation.includes("?") ? "&" : "?"}error=invalid_template` });
  }

  if (ownerType === "provider" && !ownerProviderId) {
    return respondError(request, { error: "missing_provider", message: "Hãy chọn provider sở hữu nguồn cung ứng cho dịch vụ/sản phẩm này.", location: `${createLocation}${createLocation.includes("?") ? "&" : "?"}error=missing_provider` });
  }

  const resolvedTemplateKey =
    offeringType === SYSTEM_OFFERING_TYPES.PHYSICAL_PRODUCT
      ? PHYSICAL_PRODUCT_TEMPLATE_KEY
      : offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE
        ? templateKey
        : offeringTypeDefinition.templateKey || offeringType;
  const customFieldsRaw = String(formData.get("customFields") ?? "{}");
  let customFields: Record<string, unknown> = {};
  try {
    customFields = JSON.parse(customFieldsRaw) as Record<string, unknown>;
    customFields = await validateOfferingCustomFields({
      offeringTypeDefinition,
      values: customFields,
    });
  } catch {
    return respondError(request, {
      error: "invalid_custom_fields",
      message: "Dữ liệu fields của loại sản phẩm không hợp lệ hoặc thiếu field bắt buộc.",
      location: `${createLocation}${createLocation.includes("?") ? "&" : "?"}error=invalid_custom_fields`,
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
      templateEngine,
      templateMode,
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
      providerSku,
      allowProviderSupply,
      ownerType,
      ownerProviderId: ownerType === "provider" ? ownerProviderId : undefined,
      config: {
        customFields,
        ...(!supportsInventory && offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE
          ? {
              siteDefaults: {
                ...getInvitationTemplateDefaults(templateKey),
                ...(builderDocument ? { builderDocument } : {}),
              },
            }
          : {}),
      },
      crossSells,
      upsells,
    });

    const nextLocation =
      offering.offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE && offering.templateEngine === SYSTEM_TEMPLATE_ENGINES.BUILDER
        ? ROUTES.ADMIN.OFFERING_BUILDER_EDITOR(offering.slug)
        : offering.offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE
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
