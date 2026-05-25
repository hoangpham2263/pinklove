import Link from "next/link";

import { Button } from "@/components/ui/button";
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
        <Button className="justify-start" variant="outline" render={<Link href={ROUTES.PROVIDER.CONFIG}>Quay lại cấu hình</Link>} />
        <Button className="justify-start" variant="outline" render={<Link href={ROUTES.PROVIDER.CONFIG_ADDRESSES}>Mở cấu hình địa chỉ</Link>} />
        <Button className="justify-start" variant="outline" render={<Link href={portalHref}>Mở portal đối tác</Link>} />
      </div>
    </ProviderPage>
  );
}
