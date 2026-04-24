import Link from "next/link";
import { PackageCheck, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PartnerVendorHeader } from "@/features/vendor-orders/components/partner-vendor-header";
import { countVendorAssignmentsForVendor, listVendorOrderSummariesForVendor } from "@/features/vendor-orders/server/service";
import { ensureVendorPortalSlug, getUserProfile, requireVendor } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getPaymentStatusLabel, getVendorAssignmentStatusLabel } from "@/lib/status-labels";
import { getSystemSettings } from "@/lib/system-settings";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export default async function PartnerOrdersLegacyPage() {
  const vendor = await requireVendor(ROUTES.PARTNER.LOGIN);
  const [slug, profile, stats, assignments, settings] = await Promise.all([
    ensureVendorPortalSlug(vendor.id),
    getUserProfile(vendor.id),
    countVendorAssignmentsForVendor(vendor.id),
    listVendorOrderSummariesForVendor(vendor.id),
    getSystemSettings(),
  ]);
  const portalHref = slug ? ROUTES.PARTNER.PORTAL(slug) : ROUTES.PARTNER.ROOT;
  const vendorName = profile.displayName || profile.fullName || vendor.username;
  const partnerTitle = `Đối tác của ${settings.branding.siteName}`;

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#fff8f1_0%,#fffdf9_42%,#ffffff_100%)]">
      <PartnerVendorHeader
        vendorName={vendorName}
        portalHref={portalHref}
        currentPath={ROUTES.PARTNER.LEGACY_ORDERS}
      />

      <div className="container mx-auto space-y-5 px-4 py-5 lg:py-7.5 2xl:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-zinc-200/80 bg-white/92 p-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1.5 text-sm text-amber-900">
              <Store className="h-4 w-4" />
              {partnerTitle}
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 md:text-4xl">Đơn được giao</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 md:text-base">
                Danh sách này chỉ tập trung vào các đơn hàng đã được giao cho đối tác xử lý, tách riêng khỏi màn tổng quan.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-zinc-200/80 bg-white/92"><CardHeader className="pb-2"><CardTitle className="text-base">Tổng đơn</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{stats.total}</p></CardContent></Card>
          <Card className="border-zinc-200/80 bg-white/92"><CardHeader className="pb-2"><CardTitle className="text-base">Đang xử lý</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{stats.active}</p></CardContent></Card>
          <Card className="border-zinc-200/80 bg-white/92"><CardHeader className="pb-2"><CardTitle className="text-base">Chờ review</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{stats.review}</p></CardContent></Card>
          <Card className="border-zinc-200/80 bg-white/92"><CardHeader className="pb-2"><CardTitle className="text-base">Hoàn tất</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{stats.completed}</p></CardContent></Card>
        </div>

        <Card className="border-zinc-200/80 bg-white/92">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-950">
              <PackageCheck className="h-4 w-4" />
              Danh sách đơn được giao
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {assignments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-600">
                Chưa có đơn hàng nào được giao cho đối tác này.
              </div>
            ) : (
              assignments.map((entry) => (
                <div key={entry.assignment.id} className="grid gap-3 rounded-xl border border-zinc-200/80 p-4 lg:grid-cols-[minmax(0,1fr)_220px_190px] lg:items-center">
                  <div className="space-y-1">
                    <p className="font-medium text-zinc-950">{entry.order.orderNumber}</p>
                    <p className="text-sm text-zinc-600">
                      {entry.order.customerName} • {entry.items.map((item) => `${item.productName} x${item.quantity}`).join(", ")}
                    </p>
                    <p className="text-sm text-zinc-600">
                      Trạng thái vendor: {getVendorAssignmentStatusLabel(entry.assignment.status)} • Thanh toán: {getPaymentStatusLabel(entry.order.paymentStatus)}
                    </p>
                  </div>
                  <div className="space-y-1 text-sm text-zinc-600">
                    <p>Cập nhật: {formatDateTime(entry.assignment.updatedAt)}</p>
                    <p>{entry.lastEvent?.message || "Chưa có activity"}</p>
                  </div>
                  <div className="flex justify-start lg:justify-end">
                    <Button variant="outline" render={<Link href={ROUTES.PARTNER.ORDER(entry.assignment.id)}>Mở chi tiết</Link>} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
