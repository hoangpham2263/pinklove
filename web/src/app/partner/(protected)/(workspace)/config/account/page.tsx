import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PartnerAccountSettingsForm } from "@/features/vendor-orders/components/partner-account-settings-form";
import { listUserAddresses } from "@/features/account/server/address-service";
import { ensureVendorPortalSlug, getUserProfile, getUserShippingProfile, requireVendor } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function PartnerConfigAccountPage() {
  const vendor = await requireVendor(ROUTES.PARTNER.LOGIN);
  const [portalSlug, profile, shippingProfile, addresses] = await Promise.all([
    ensureVendorPortalSlug(vendor.id),
    getUserProfile(vendor.id),
    getUserShippingProfile(vendor.id),
    listUserAddresses(vendor.id),
  ]);
  const portalHref = portalSlug ? ROUTES.PARTNER.PORTAL(portalSlug) : ROUTES.PARTNER.ROOT;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-5">
        <div className="rounded-md border bg-background p-6">
          <h1 className="text-2xl font-semibold tracking-tight">Tài khoản vendor</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Cấu hình thông tin cửa hàng và vận hành. Địa chỉ thực tế dùng chung từ sổ địa chỉ vendor.
          </p>
        </div>

        <PartnerAccountSettingsForm
          initialProfile={profile}
          initialShippingProfile={shippingProfile}
          addresses={addresses}
          portalHref={portalHref}
        />

        <div className="flex flex-wrap gap-3">
          <Button className="justify-start" variant="outline" render={<Link href={ROUTES.PARTNER.CONFIG}>Quay lại configs</Link>} />
          <Button className="justify-start" variant="outline" render={<Link href={ROUTES.PARTNER.CONFIG_ADDRESSES}>Mở cấu hình địa chỉ</Link>} />
          <Button className="justify-start" variant="outline" render={<Link href={portalHref}>Mở portal đối tác</Link>} />
        </div>
      </div>
    </section>
  );
}

