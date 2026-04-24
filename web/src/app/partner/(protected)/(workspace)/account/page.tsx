import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PartnerVendorHeader } from "@/features/vendor-orders/components/partner-vendor-header";
import { ensureVendorPortalSlug, getUserProfile, requireVendor } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function PartnerAccountPage() {
  const vendor = await requireVendor(ROUTES.PARTNER.LOGIN);
  const [portalSlug, profile] = await Promise.all([
    ensureVendorPortalSlug(vendor.id),
    getUserProfile(vendor.id),
  ]);
  const vendorName = profile.displayName || profile.fullName || vendor.username;
  const portalHref = portalSlug ? ROUTES.PARTNER.PORTAL(portalSlug) : ROUTES.PARTNER.ROOT;

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#fff8f1_0%,#fffdf9_42%,#ffffff_100%)]">
      <PartnerVendorHeader
        vendorName={vendorName}
        portalHref={portalHref}
        currentPath={ROUTES.PARTNER.ACCOUNT}
      />

      <div className="container mx-auto space-y-5 px-4 py-5 lg:py-7.5 2xl:py-10">
        <div className="rounded-3xl border border-zinc-200/80 bg-white/92 p-6">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Thông tin đối tác</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 md:text-base">
            Quản lý thông tin liên hệ và lối vào nhanh cho workspace của đối tác.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-zinc-200/80 bg-white/92">
            <CardHeader>
              <CardTitle>Hồ sơ đối tác</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-200/80 p-4">
                <p className="text-sm text-zinc-500">Tên đăng nhập</p>
                <p className="mt-1 text-lg font-semibold text-zinc-950">{vendor.username}</p>
              </div>
              <div className="rounded-xl border border-zinc-200/80 p-4">
                <p className="text-sm text-zinc-500">Tên hiển thị</p>
                <p className="mt-1 text-lg font-semibold text-zinc-950">{profile.displayName || profile.fullName || "Chưa cập nhật"}</p>
              </div>
              <div className="rounded-xl border border-zinc-200/80 p-4">
                <p className="text-sm text-zinc-500">Số điện thoại</p>
                <p className="mt-1 text-lg font-semibold text-zinc-950">{profile.phone || "Chưa cập nhật"}</p>
              </div>
              <div className="rounded-xl border border-zinc-200/80 p-4">
                <p className="text-sm text-zinc-500">Portal riêng</p>
                <p className="mt-1 text-sm font-semibold text-zinc-950">{portalHref}</p>
              </div>
              <div className="rounded-xl border border-zinc-200/80 p-4 md:col-span-2">
                <p className="text-sm text-zinc-500">Giới thiệu</p>
                <p className="mt-1 text-sm leading-6 text-zinc-700">{profile.bio || "Chưa cập nhật thông tin giới thiệu."}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200/80 bg-white/92">
            <CardHeader>
              <CardTitle>Đi nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline" render={<Link href={portalHref}>Mở tổng quan đối tác</Link>} />
              <Button className="w-full justify-start" variant="outline" render={<Link href={ROUTES.PARTNER.LEGACY_ORDERS}>Mở danh sách đơn được giao</Link>} />
              <Button className="w-full justify-start" variant="outline" render={<Link href={ROUTES.PARTNER.PRODUCTS}>Mở hồ sơ sản phẩm vendor</Link>} />
              <Button className="w-full justify-start" variant="outline" render={<Link href={ROUTES.CUSTOMER.PROFILE}>Cập nhật hồ sơ liên hệ</Link>} />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
