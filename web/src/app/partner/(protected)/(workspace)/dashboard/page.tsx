import Link from "next/link";
import { PackageCheck, PackagePlus, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { countProviderAssignmentsForProvider, listProviderOrderSummariesForProvider } from "@/features/provider-orders/server/service";
import { ensureProviderPortalSlug, getUserProfile, requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

export default async function PartnerDashboardPage() {
  const provider = await requireProvider(ROUTES.PARTNER.LOGIN);
  const [slug, profile, stats, assignments, settings] = await Promise.all([
    ensureProviderPortalSlug(provider.id),
    getUserProfile(provider.id),
    countProviderAssignmentsForProvider(provider.id),
    listProviderOrderSummariesForProvider(provider.id),
    getSystemSettings(),
  ]);
  const providerName = profile.displayName || profile.fullName || provider.username;
  const portalHref = slug ? ROUTES.PARTNER.PORTAL(slug) : ROUTES.PARTNER.ROOT;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-md border bg-background p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard provider</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Workspace của {providerName} trong {settings.branding.siteName}. Giao diện dùng cùng layout quản trị để provider theo dõi đơn, sản phẩm và cấu hình tài khoản.
          </p>
        </div>
        <Button variant="outline" render={<Link href={portalHref}>Mở portal công khai</Link>} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Tổng đơn</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-semibold">{stats.total}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Đang xử lý</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-semibold">{stats.active}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Chờ review</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-semibold">{stats.review}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Hoàn tất</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-semibold">{stats.completed}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PackageCheck className="h-4 w-4" />
              Đơn gần đây
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignments.slice(0, 5).map((entry) => (
              <div key={entry.assignment.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{entry.order.orderNumber}</p>
                <p className="mt-1 text-muted-foreground">{entry.order.customerName}</p>
              </div>
            ))}
            {assignments.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có đơn được giao.</p> : null}
            <Button variant="outline" className="w-full" render={<Link href={ROUTES.PARTNER.ORDERS}>Mở tất cả đơn</Link>} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PackagePlus className="h-4 w-4" />
              Sản phẩm
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Provider có thể tạo hồ sơ sản phẩm, chỉnh sửa và gửi admin duyệt.</p>
            <Button variant="outline" className="w-full" render={<Link href={ROUTES.PARTNER.OFFERINGS}>Mở sản phẩm</Link>} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-4 w-4" />
              Tài khoản
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Cập nhật thông tin cửa hàng, địa chỉ và hồ sơ giao nhận của provider.</p>
            <Button variant="outline" className="w-full" render={<Link href={ROUTES.PARTNER.CONFIG_ACCOUNT}>Mở tài khoản</Link>} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
