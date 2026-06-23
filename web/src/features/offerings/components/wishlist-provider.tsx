"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { customerApi } from "@/lib/api-client.customer";
import { WishlistContext } from "@/features/offerings/use-wishlist";
import type { WishlistOfferingInput } from "@/features/offerings/wishlist";
import { ROUTES } from "@/lib/routes";

type WishlistProviderProps = {
  authenticated: boolean;
  initialOfferingIds: string[];
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
  initialOfferingIds,
  children,
}: WishlistProviderProps) {
  const router = useRouter();
  const [offeringIds, setOfferingIds] = useState(initialOfferingIds);

  const isWishlisted = useCallback(
    (offeringId: string) => offeringIds.includes(offeringId),
    [offeringIds]
  );

  const toggleOffering = useCallback(async (offering: WishlistOfferingInput) => {
    if (!authenticated) {
      router.push(buildLoginHref());
      return null;
    }

    const formData = new FormData();
    formData.set("intent", "toggle");
    formData.set("offeringId", offering.id);
    formData.set("returnTo", typeof window === "undefined" ? ROUTES.WISHLIST : `${window.location.pathname}${window.location.search}${window.location.hash}`);

    try {
      const result = await customerApi.updateWishlist(formData);
      const nextOfferingIds = Array.isArray(result.offeringIds)
        ? result.offeringIds.map((item) => String(item))
        : [];

      setOfferingIds(nextOfferingIds);

      return {
        added: Boolean(result.added),
        offeringIds: nextOfferingIds,
      };
    } catch (error) {
      if (error instanceof Error && /Please login first/i.test(error.message)) {
        router.push(buildLoginHref());
        return null;
      }

      throw error;
    }
  }, [authenticated, router]);

  const removeOffering = useCallback(async (offering: WishlistOfferingInput) => {
    if (!authenticated) {
      router.push(buildLoginHref());
      return null;
    }

    const formData = new FormData();
    formData.set("intent", "remove");
    formData.set("offeringId", offering.id);

    try {
      const result = await customerApi.updateWishlist(formData);
      const nextOfferingIds = Array.isArray(result.offeringIds)
        ? result.offeringIds.map((item) => String(item))
        : [];

      setOfferingIds(nextOfferingIds);

      return {
        removed: Boolean(result.removed),
        offeringIds: nextOfferingIds,
      };
    } catch (error) {
      if (error instanceof Error && /Please login first/i.test(error.message)) {
        router.push(buildLoginHref());
        return null;
      }

      throw error;
    }
  }, [authenticated, router]);

  const value = useMemo(() => ({
    authenticated,
    offeringIds,
    count: offeringIds.length,
    isWishlisted,
    toggleOffering,
    removeOffering,
  }), [authenticated, isWishlisted, offeringIds, removeOffering, toggleOffering]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}
