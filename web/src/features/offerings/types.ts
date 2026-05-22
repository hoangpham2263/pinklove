export type OfferingType = string;
export type OfferingFulfillmentType = "digital" | "physical" | "service";
export type OfferingOwnerType = "internal" | "vendor";

export type OfferingTypeFieldType = "text" | "textarea" | "number" | "boolean" | "select" | "url" | "date";

export type OfferingTypeField = {
  key: string;
  label: string;
  type: OfferingTypeFieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
};

export type OfferingTypeDefinition = {
  id: string;
  key: OfferingType;
  label: string;
  description?: string;
  status: "draft" | "active" | "archived";
  fulfillmentType: OfferingFulfillmentType;
  templateKey: string;
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
  return offeringType === "coded_template" || offeringType === "builder";
}

export function isBuilderOfferingType(offeringType: OfferingType) {
  return offeringType === "builder";
}

export function isGeneralOfferingType(offeringType: OfferingType) {
  return offeringType === "general_offering";
}

export function getOfferingTypeLabel(offeringType: OfferingType) {
  switch (offeringType) {
    case "builder":
      return "Builder";
    case "general_offering":
      return "Sản phẩm";
    case "coded_template":
    default:
      return "Coded";
  }
}
