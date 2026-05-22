import type { Offering, OfferingType } from "@/features/offerings/types";
import { getOfferingPath } from "@/lib/public-paths";

export type WishlistOfferingInput = {
  id: string;
  slug: string;
  offeringType: OfferingType;
  name: string;
  excerpt?: string;
  thumbnailUrl?: string;
  price: number;
};

export function createWishlistOfferingSnapshot(
  offering: Pick<Offering, "id" | "slug" | "offeringType" | "name" | "excerpt" | "thumbnailUrl" | "price">
): WishlistOfferingInput {
  return {
    id: offering.id,
    slug: offering.slug,
    offeringType: offering.offeringType,
    name: offering.name,
    excerpt: offering.excerpt,
    thumbnailUrl: offering.thumbnailUrl,
    price: offering.price,
  };
}

export function getWishlistOfferingHref(
  offering: Pick<WishlistOfferingInput, "slug" | "offeringType">
) {
  return getOfferingPath(offering);
}
