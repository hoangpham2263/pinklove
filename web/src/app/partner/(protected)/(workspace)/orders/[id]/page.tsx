import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Store } from "lucide-react";

import { PageToast } from "@/components/common/page-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PartnerVendorAssignmentPanel } from "@/features/vendor-orders/components/partner-vendor-assignment-panel";
import { getVendorOrderDetailForVendor } from "@/features/vendor-orders/server/service";
import { ensureVendorPortalSlug, requireVendor } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { ROUTES } from "@/lib/routes";
import { getVendorAssignmentStatusLabel } from "@/lib/status-labels";
import { getSystemSettings } from "@/lib/system-settings";

export default async function PartnerOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const vendor = await requireVendor(ROUTES.PARTNER.LOGIN);
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const portalSlug = await ensureVendorPortalSlug(vendor.id);
  const [detail, settings] = await Promise.all([
    getVendorOrderDetailForVendor(vendor.id, id),
    getSystemSettings(),
  ]);

  if (!detail) {
    notFound();
  }

  const partnerTitle = `Đối tác của ${settings.branding.siteName}`;

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#fff8f1_0%,#fffdf9_42%,#ffffff_100%)] py-5 lg:py-7.5 2xl:py-10">
      <div className="container mx-auto space-y-5 px-4">
        {query.saved ? <PageToast message="Đã lưu cập nhật." variant="success" cleanupKeys={["saved"]} /> : null}

        <div className="rounded-3xl border border-zinc-200/80 bg-white/92 p-6">
          <div className="flex flex-col gap-5">
            <div className="flex justify-start">
              <Button
                variant="outline"
                className="gap-2"
                render={
                  <Link href={portalSlug ? ROUTES.PARTNER.PORTAL(portalSlug) : ROUTES.PARTNER.ROOT}>
                    <ArrowLeft className="h-4 w-4" />
                    Danh sách đơn hàng
                  </Link>
                }
              />
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1.5 text-sm text-amber-900">
                  <Store className="h-4 w-4" />
                  {partnerTitle}
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 md:text-4xl">{detail.order.orderNumber}</h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 md:text-base">
                    Theo dõi tiến độ xử lý đơn hàng và cập nhật ngay khi có thay đổi để đội ngũ quản lý nắm tiến độ theo thời gian thực.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded-xl border border-zinc-200/80 p-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Khách hàng</p>
                <p className="mt-1 font-medium text-zinc-950">{detail.order.customerName}</p>
                <p className="text-zinc-600">{detail.order.customerPhone || "Chưa có số điện thoại"}</p>
              </div>
              <div className="rounded-xl border border-zinc-200/80 p-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Trạng thái xử lý</p>
                <p className="mt-1 font-medium text-zinc-950">{getVendorAssignmentStatusLabel(detail.assignment.status)}</p>
              </div>
              <div className="rounded-xl border border-zinc-200/80 p-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Email</p>
                <p className="mt-1 font-medium text-zinc-950">{detail.order.customerEmail || "Chưa có email"}</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="border-zinc-200/80 bg-white/90">
          <CardHeader className="border-b">
            <CardTitle className="text-base font-semibold text-zinc-950">Sản phẩm được giao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {detail.order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-zinc-200/80 p-3">
                <div>
                  <p className="font-medium text-zinc-950">{item.productName}</p>
                  <p className="text-sm text-zinc-600">{item.fulfillmentType} • Số lượng {item.quantity}</p>
                </div>
                <div className="font-semibold text-zinc-950">{formatCurrency(item.lineTotal, settings.ecommerce)}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <PartnerVendorAssignmentPanel
          detailUrl={`/api/partner/vendor-assignments/${detail.assignment.id}`}
          submitUrl={ROUTES.API.PARTNER.ORDERS.UPDATE}
          portalHref={portalSlug ? ROUTES.PARTNER.PORTAL(portalSlug) : ROUTES.PARTNER.ROOT}
          initialDetail={detail}
        />
      </div>
    </section>
  );
}
