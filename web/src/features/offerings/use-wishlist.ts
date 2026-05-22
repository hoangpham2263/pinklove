"use client";

import { createContext, useContext } from "react";
import type { WishlistOfferingInput } from "@/features/offerings/wishlist";

export type WishlistContextValue = {
  authenticated: boolean;
  offeringIds: string[];
  count: number;
  isWishlisted: (offeringId: string) => boolean;
  toggleOffering: (offering: WishlistOfferingInput) => Promise<{ added: boolean; offeringIds: string[] } | null>;
  removeOffering: (offering: WishlistOfferingInput) => Promise<{ removed: boolean; offeringIds: string[] } | null>;
};

export const WishlistContext = createContext<WishlistContextValue | null>(null);

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider.");
  }
  return context;
}
