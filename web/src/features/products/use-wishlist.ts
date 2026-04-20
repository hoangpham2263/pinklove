"use client";

import { createContext, useContext } from "react";
import type { WishlistProductInput } from "@/features/products/wishlist";

export type WishlistContextValue = {
  authenticated: boolean;
  productIds: string[];
  count: number;
  isWishlisted: (productId: string) => boolean;
  toggleProduct: (product: WishlistProductInput) => Promise<{ added: boolean; productIds: string[] } | null>;
  removeProduct: (product: WishlistProductInput) => Promise<{ removed: boolean; productIds: string[] } | null>;
};

export const WishlistContext = createContext<WishlistContextValue | null>(null);

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider.");
  }
  return context;
}
