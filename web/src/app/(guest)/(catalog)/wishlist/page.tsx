import type { Metadata } from "next";
import { WishlistPageClient } from "@/features/products/components/wishlist-page-client";
import { listPublishedProductsByIds } from "@/features/products/server/service";
import { getUserWishlistProductIds } from "@/features/products/server/wishlist-service";
import { requireAppUser } from "@/lib/auth";
import { sanitizePermalinkConfig } from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";
import { createSeoMetadata } from "@/lib/seo";
import { getSystemSettings } from "@/lib/system-settings";

export async function generateMetadata(): Promise<Metadata> {
  return createSeoMetadata({
    title: "Wishlist",
    description: "Danh sach san pham yeu thich tren PinkLove.",
    path: ROUTES.WISHLIST,
  });
}

export default async function WishlistPage() {
  const user = await requireAppUser(`${ROUTES.AUTH.LOGIN}?returnTo=${encodeURIComponent(ROUTES.WISHLIST)}`);
  const wishlistProductIds = await getUserWishlistProductIds(user.id);
  const [products, settings] = await Promise.all([
    listPublishedProductsByIds(wishlistProductIds),
    getSystemSettings(),
  ]);

  return (
    <WishlistPageClient
      products={products}
      permalinkConfig={sanitizePermalinkConfig(settings.permalink)}
    />
  );
}
