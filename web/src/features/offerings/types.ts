export type OfferingType = string;
export type OfferingStatus = "draft" | "pending_review" | "published" | "archived" | "disabled";
export type OfferingFulfillmentType = "digital" | "physical" | "service";
export type OfferingOwnerType = "internal" | "provider";
export type OfferingTemplateEngine = "coded" | "builder" | "hybrid" | "motion" | "video" | "ai_generated";
export type OfferingTemplateMode = "fixed" | "editable" | "hybrid";

export const SYSTEM_OFFERING_TYPES = {
  DIGITAL_TEMPLATE: "digital_template",
  PHYSICAL_PRODUCT: "physical_product",
  WEDDING_VIDEO: "wedding_video",
  WEDDING_PHOTO: "wedding_photo",
  BRIDAL_MAKEUP: "bridal_makeup",
  WEDDING_DECORATION: "wedding_decoration",
  WEDDING_PLANNER: "wedding_planner",
  WEDDING_GIFT: "wedding_gift",
} as const;

export const SYSTEM_TEMPLATE_ENGINES = {
  CODED: "coded",
  BUILDER: "builder",
  HYBRID: "hybrid",
  MOTION: "motion",
  VIDEO: "video",
  AI_GENERATED: "ai_generated",
} as const;

export const SYSTEM_TEMPLATE_MODES = {
  FIXED: "fixed",
  EDITABLE: "editable",
  HYBRID: "hybrid",
} as const;

export const BUILDER_TEMPLATE_KEY = "freeform_sections";
export const PHYSICAL_PRODUCT_TEMPLATE_KEY = SYSTEM_OFFERING_TYPES.PHYSICAL_PRODUCT;

export const OFFERING_STATUSES: OfferingStatus[] = [
  "draft",
  "pending_review",
  "published",
  "archived",
  "disabled",
];

export function getOfferingStatusLabel(status: OfferingStatus) {
  switch (status) {
    case "pending_review":
      return "Pending review";
    case "published":
      return "Published";
    case "archived":
      return "Archived";
    case "disabled":
      return "Disabled";
    case "draft":
    default:
      return "Draft";
  }
}

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

export const OFFERING_TYPE_FIELD_TYPES: OfferingTypeFieldType[] = [
  "text",
  "textarea",
  "richtext",
  "number",
  "boolean",
  "select",
  "multiselect",
  "date",
  "datetime",
  "media",
  "gallery",
  "price",
  "location",
  "json",
  "repeater",
  "relation",
  "blocks",
  "url",
];

export type OfferingTypeField = {
  id?: string;
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
  groupId?: string;
  visibilityConditions?: Record<string, unknown>;
  dependencyConditions?: Record<string, unknown>;
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
  supportsProviderSupply: boolean;
  isSystem: boolean;
  fieldGroups?: OfferingTypeFieldGroup[];
  fieldSchema: OfferingTypeField[];
  createdAt: string;
  updatedAt: string;
};

export type OfferingTypeFieldGroup = {
  id?: string;
  key: string;
  label: string;
  sortOrder?: number;
  uiConfig?: Record<string, unknown>;
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
  status: OfferingStatus;
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
  providerSku: string;
  allowProviderSupply: boolean;
  ownerType: OfferingOwnerType;
  ownerProviderId?: string;
  ownerProviderType?: string;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  crossSells?: Pick<Offering, "id" | "name" | "thumbnailUrl" | "price" | "slug">[];
  upsells?: Pick<Offering, "id" | "name" | "thumbnailUrl" | "price" | "slug">[];
};

export function isOfferingInStock(offering: Pick<Offering, "trackInventory" | "stockQuantity" | "allowBackorder">) {
  return !offering.trackInventory || offering.allowBackorder || offering.stockQuantity > 0;
}

export function isInvitationOfferingType(offeringType: OfferingType) {
  return offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE;
}

export function isBuilderOfferingType(offeringType: OfferingType) {
  return offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE;
}

export function isGeneralOfferingType(offeringType: OfferingType) {
  return offeringType !== SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE;
}

export function getOfferingTypeLabel(offeringType: OfferingType) {
  switch (offeringType) {
    case SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE:
      return "Thiệp cưới online";
    case SYSTEM_OFFERING_TYPES.PHYSICAL_PRODUCT:
      return "Thiệp giấy";
    case SYSTEM_OFFERING_TYPES.WEDDING_VIDEO:
      return "Làm video cưới";
    case SYSTEM_OFFERING_TYPES.WEDDING_PHOTO:
      return "Chụp ảnh cưới";
    case SYSTEM_OFFERING_TYPES.BRIDAL_MAKEUP:
      return "Makeup cô dâu";
    case SYSTEM_OFFERING_TYPES.WEDDING_DECORATION:
      return "Trang trí tiệc cưới";
    case SYSTEM_OFFERING_TYPES.WEDDING_PLANNER:
      return "Wedding planner";
    case SYSTEM_OFFERING_TYPES.WEDDING_GIFT:
      return "Quà cưới";
    default:
      return offeringType;
  }
}
