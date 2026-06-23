import type { Metadata } from "next";
import { WishlistPageClient } from "@/features/offerings/components/wishlist-page-client";
import { listPublishedOfferingsByIds } from "@/features/offerings/server/service";
import { getUserWishlistOfferingIds } from "@/features/offerings/server/wishlist-service";
import { getUserProfile, requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { createSeoMetadata } from "@/lib/seo";
import { getSystemSettings } from "@/lib/system-settings";

export async function generateMetadata(): Promise<Metadata> {
  return createSeoMetadata({
    title: "Yêu thích",
    description: "Danh sách sản phẩm yêu thích trên PinkLove.",
    path: ROUTES.WISHLIST,
  });
}

export default async function WishlistPage() {
  const user = await requireAppUser(`${ROUTES.AUTH.LOGIN}?returnTo=${encodeURIComponent(ROUTES.WISHLIST)}`);
  const wishlistOfferingIds = await getUserWishlistOfferingIds(user.id);
  const [offerings, settings, profile] = await Promise.all([
    listPublishedOfferingsByIds(wishlistOfferingIds),
    getSystemSettings(),
    getUserProfile(user.id),
  ]);

  return (
    <WishlistPageClient
      offerings={offerings}
      ecommerceSettings={settings.ecommerce}
      customerName={profile.displayName || profile.fullName || user.accountName}
      customerPhone={profile.phone}
      customerEmail={user.email}
    />
  );
}
