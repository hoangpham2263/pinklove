import { CheckoutPageView } from "@/features/ecommerce/components/checkout-page";
import { listUserAddresses } from "@/features/account/server/address-service";
import { listCartItems, syncCartWithWishlist } from "@/features/ecommerce/server/service";
import { getUserProfile, requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

type CheckoutPageProps = {
  searchParams?: Promise<{
    selectedOfferingIds?: string | string[];
  }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const params = await searchParams;
  const selectedOfferingIds = Array.isArray(params?.selectedOfferingIds)
    ? params.selectedOfferingIds
    : params?.selectedOfferingIds
      ? [params.selectedOfferingIds]
      : undefined;

  await syncCartWithWishlist(user.id, selectedOfferingIds);
  const [items, profile, addresses, settings] = await Promise.all([
    listCartItems(user.id),
    getUserProfile(user.id),
    listUserAddresses(user.id),
    getSystemSettings(),
  ]);

  return (
    <CheckoutPageView
      items={items}
      customerName={profile.displayName || profile.fullName || user.accountName}
      customerPhone={profile.phone}
      customerEmail={user.email}
      addresses={addresses}
      settings={settings}
    />
  );
}
