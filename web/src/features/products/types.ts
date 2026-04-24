export type ProductType = "coded_template" | "builder_template" | "general_product";
export type ProductFulfillmentType = "digital" | "physical" | "service";
export type ProductOwnerType = "internal" | "vendor";

export type ProductCategory = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  excerpt?: string;
  description?: string;
  status: "draft" | "published";
  productType: ProductType;
  templateKey: string;
  categoryId?: string;
  categorySlug?: string;
  categoryName?: string;
  thumbnailUrl?: string;
  price: number;
  fulfillmentType: ProductFulfillmentType;
  trackInventory: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  costPrice: number;
  vendorSku: string;
  ownerType: ProductOwnerType;
  ownerVendorUserId?: string;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export function isProductInStock(product: Pick<Product, "trackInventory" | "stockQuantity" | "allowBackorder">) {
  return !product.trackInventory || product.allowBackorder || product.stockQuantity > 0;
}

export function isInvitationProductType(productType: ProductType) {
  return productType === "coded_template" || productType === "builder_template";
}

export function isBuilderProductType(productType: ProductType) {
  return productType === "builder_template";
}

export function isGeneralProductType(productType: ProductType) {
  return productType === "general_product";
}
