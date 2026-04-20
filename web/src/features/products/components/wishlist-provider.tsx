"use client";

import { useCallback, useMemo, useState } from "react";
import { postForm } from "@/lib/client-mutation";
import { WishlistContext } from "@/features/products/use-wishlist";
import type { WishlistProductInput } from "@/features/products/wishlist";
import { ROUTES } from "@/lib/routes";

type WishlistProviderProps = {
  authenticated: boolean;
  initialProductIds: string[];
  children: React.ReactNode;
};

function buildLoginHref() {
  if (typeof window === "undefined") {
    return ROUTES.AUTH.LOGIN;
  }

  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return `${ROUTES.AUTH.LOGIN}?returnTo=${encodeURIComponent(returnTo)}`;
}

export function WishlistProvider({
  authenticated,
  initialProductIds,
  children,
}: WishlistProviderProps) {
  const [productIds, setProductIds] = useState(initialProductIds);

  const isWishlisted = useCallback(
    (productId: string) => productIds.includes(productId),
    [productIds]
  );

  const toggleProduct = useCallback(async (product: WishlistProductInput) => {
    if (!authenticated) {
      window.location.href = buildLoginHref();
      return null;
    }

    const formData = new FormData();
    formData.set("intent", "toggle");
    formData.set("productId", product.id);
    formData.set("returnTo", typeof window === "undefined" ? ROUTES.WISHLIST : `${window.location.pathname}${window.location.search}${window.location.hash}`);

    try {
      const result = await postForm(ROUTES.API.CUSTOMER.WISHLIST, formData);
      const nextProductIds = Array.isArray(result.productIds)
        ? result.productIds.map((item) => String(item))
        : [];

      setProductIds(nextProductIds);

      return {
        added: Boolean(result.added),
        productIds: nextProductIds,
      };
    } catch (error) {
      if (error instanceof Error && /Please login first/i.test(error.message)) {
        window.location.href = buildLoginHref();
        return null;
      }

      throw error;
    }
  }, [authenticated]);

  const removeProduct = useCallback(async (product: WishlistProductInput) => {
    if (!authenticated) {
      window.location.href = buildLoginHref();
      return null;
    }

    const formData = new FormData();
    formData.set("intent", "remove");
    formData.set("productId", product.id);

    try {
      const result = await postForm(ROUTES.API.CUSTOMER.WISHLIST, formData);
      const nextProductIds = Array.isArray(result.productIds)
        ? result.productIds.map((item) => String(item))
        : [];

      setProductIds(nextProductIds);

      return {
        removed: Boolean(result.removed),
        productIds: nextProductIds,
      };
    } catch (error) {
      if (error instanceof Error && /Please login first/i.test(error.message)) {
        window.location.href = buildLoginHref();
        return null;
      }

      throw error;
    }
  }, [authenticated]);

  const value = useMemo(() => ({
    authenticated,
    productIds,
    count: productIds.length,
    isWishlisted,
    toggleProduct,
    removeProduct,
  }), [authenticated, isWishlisted, productIds, removeProduct, toggleProduct]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}
