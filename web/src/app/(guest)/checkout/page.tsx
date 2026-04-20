import { CheckoutPageView } from "@/features/ecommerce/components/checkout-page";
import { listCartItems, syncCartWithWishlist } from "@/features/ecommerce/server/service";
import { getUserProfile, requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

export default async function CheckoutPage() {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  await syncCartWithWishlist(user.id);
  const [items, profile, settings] = await Promise.all([
    listCartItems(user.id),
    getUserProfile(user.id),
    getSystemSettings(),
  ]);

  return (
    <CheckoutPageView
      items={items}
      customerName={profile.displayName || profile.fullName || user.username}
      customerPhone={profile.phone}
      customerEmail={`${user.username}@pinklove.local`}
      shippingName={profile.displayName || profile.fullName}
      settings={settings}
    />
  );
}
