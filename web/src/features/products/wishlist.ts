import type { Product, ProductType } from "@/features/products/types";
import { getBuilderProductPath, getTemplateProductPath, type PublicPermalinkConfig } from "@/lib/public-paths";

export type WishlistProductInput = {
  id: string;
  slug: string;
  productType: ProductType;
  name: string;
  excerpt?: string;
  thumbnailUrl?: string;
  price: number;
};

export function createWishlistProductSnapshot(
  product: Pick<Product, "id" | "slug" | "productType" | "name" | "excerpt" | "thumbnailUrl" | "price">
): WishlistProductInput {
  return {
    id: product.id,
    slug: product.slug,
    productType: product.productType,
    name: product.name,
    excerpt: product.excerpt,
    thumbnailUrl: product.thumbnailUrl,
    price: product.price,
  };
}

export function getWishlistProductHref(
  product: Pick<WishlistProductInput, "slug" | "productType">,
  config: PublicPermalinkConfig
) {
  return product.productType === "builder_template"
    ? getBuilderProductPath(product.slug, config)
    : getTemplateProductPath(product.slug, config);
}
