import type { Metadata } from "next";
import { WishlistPageClient } from "@/features/products/components/wishlist-page-client";
import { listPublishedProductsByIds } from "@/features/products/server/service";
import { getUserWishlistProductIds } from "@/features/products/server/wishlist-service";
import { getUserProfile, requireAppUser } from "@/lib/auth";
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
  const [products, settings, profile] = await Promise.all([
    listPublishedProductsByIds(wishlistProductIds),
    getSystemSettings(),
    getUserProfile(user.id),
  ]);

  return (
    <WishlistPageClient
      products={products}
      ecommerceSettings={settings.ecommerce}
      customerName={profile.displayName || profile.fullName || user.username}
      customerPhone={profile.phone}
      customerEmail={`${user.username}@pinklove.local`}
    />
  );
}
