export type OfferingType = string;
export type OfferingFulfillmentType = "digital" | "physical" | "service";
export type OfferingOwnerType = "internal" | "vendor";
export type OfferingTemplateEngine = "coded" | "builder" | "hybrid" | "motion" | "video" | "ai_generated";
export type OfferingTemplateMode = "fixed" | "editable" | "hybrid";

export type OfferingTypeFieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "boolean"
  | "select"
  | "multiselect"
  | "date"
  | "datetime"
  | "media"
  | "gallery"
  | "price"
  | "location"
  | "json"
  | "repeater"
  | "relation"
  | "blocks"
  | "url";

export type OfferingTypeField = {
  key: string;
  label: string;
  type: OfferingTypeFieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  defaultValue?: unknown;
  validationRules?: Record<string, unknown>;
  uiConfig?: Record<string, unknown>;
  sortOrder?: number;
  relationTarget?: string;
  relationMultiple?: boolean;
  relationConfig?: Record<string, unknown>;
};

export type OfferingTypeDefinition = {
  id: string;
  key: OfferingType;
  label: string;
  description?: string;
  status: "draft" | "active" | "archived";
  fulfillmentType: OfferingFulfillmentType;
  templateKey: string;
  templateEngine?: OfferingTemplateEngine;
  templateMode?: OfferingTemplateMode;
  supportsInventory: boolean;
  supportsVendorSupply: boolean;
  isSystem: boolean;
  fieldSchema: OfferingTypeField[];
  createdAt: string;
  updatedAt: string;
};

export type OfferingCategory = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
};

export type Offering = {
  id: string;
  slug: string;
  name: string;
  excerpt?: string;
  description?: string;
  status: "draft" | "published";
  offeringType: OfferingType;
  templateKey: string;
  templateEngine?: OfferingTemplateEngine;
  templateMode?: OfferingTemplateMode;
  categoryId?: string;
  categorySlug?: string;
  categoryName?: string;
  thumbnailUrl?: string;
  price: number;
  fulfillmentType: OfferingFulfillmentType;
  trackInventory: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  costPrice: number;
  vendorSku: string;
  ownerType: OfferingOwnerType;
  ownerVendorUserId?: string;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export function isOfferingInStock(offering: Pick<Offering, "trackInventory" | "stockQuantity" | "allowBackorder">) {
  return !offering.trackInventory || offering.allowBackorder || offering.stockQuantity > 0;
}

export function isInvitationOfferingType(offeringType: OfferingType) {
  return offeringType === "digital_template";
}

export function isBuilderOfferingType(offeringType: OfferingType) {
  return offeringType === "digital_template";
}

export function isGeneralOfferingType(offeringType: OfferingType) {
  return offeringType === "physical_product";
}

export function getOfferingTypeLabel(offeringType: OfferingType) {
  switch (offeringType) {
    case "digital_template":
      return "Mẫu digital";
    case "physical_product":
      return "Sản phẩm vật lý";
    case "service":
      return "Dịch vụ";
    case "creator_service":
      return "Creator service";
    case "experience":
      return "Experience";
    case "subscription":
      return "Subscription";
    case "addon":
      return "Addon";
    default:
      return offeringType;
  }
}
