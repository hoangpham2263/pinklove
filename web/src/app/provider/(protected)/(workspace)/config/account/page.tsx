import { ProviderLinkButton } from "@/features/provider-orders/components/provider-buttons";
import { ProviderAccountSettingsForm } from "@/features/provider-orders/components/provider-account-settings-form";
import { ProviderPage, ProviderPageHeader } from "@/features/provider-orders/components/provider-page";
import { listUserAddresses } from "@/features/account/server/address-service";
import { getUserProfile, getUserShippingProfile, requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function ProviderConfigAccountPage() {
  const provider = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const [profile, shippingProfile, addresses] = await Promise.all([
    getUserProfile(provider.id),
    getUserShippingProfile(provider.id),
    listUserAddresses(provider.id),
  ]);
  const portalHref = ROUTES.PROVIDER.ROOT;

  return (
    <ProviderPage>
      <ProviderPageHeader
        title="Tài khoản provider"
        description="Cấu hình thông tin cửa hàng và vận hành. Địa chỉ thực tế dùng chung từ địa chỉ provider."
      />

      <ProviderAccountSettingsForm
        initialProfile={profile}
        initialShippingProfile={shippingProfile}
        addresses={addresses}
        portalHref={portalHref}
      />

      <div className="flex flex-wrap gap-3">
        <ProviderLinkButton href={ROUTES.PROVIDER.CONFIG} className="justify-start">Quay lại cấu hình</ProviderLinkButton>
        <ProviderLinkButton href={ROUTES.PROVIDER.CONFIG_ADDRESSES} className="justify-start">Mở cấu hình địa chỉ</ProviderLinkButton>
        <ProviderLinkButton href={portalHref} className="justify-start">Mở portal đối tác</ProviderLinkButton>
      </div>
    </ProviderPage>
  );
}
