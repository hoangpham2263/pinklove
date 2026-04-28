import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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

  const portalHref = portalSlug ? ROUTES.PARTNER.PORTAL(portalSlug) : ROUTES.PARTNER.ROOT;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-5">
        {query.saved ? <PageToast message="Đã lưu cập nhật." variant="success" cleanupKeys={["saved"]} /> : null}

        <div className="rounded-md border bg-background p-6">
          <div className="flex flex-col gap-5">
            <div className="flex justify-start">
              <Button
                variant="outline"
                className="gap-2"
                render={
                  <Link href={ROUTES.PARTNER.LEGACY_ORDERS}>
                    <ArrowLeft className="h-4 w-4" />
                    Danh sách đơn hàng
                  </Link>
                }
              />
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">{detail.order.orderNumber}</h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                    Theo dõi tiến độ xử lý đơn hàng và cập nhật ngay khi có thay đổi để đội ngũ quản lý nắm tiến độ theo thời gian thực.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded-md border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Khách hàng</p>
                <p className="mt-1 font-medium">{detail.order.customerName}</p>
                <p className="text-muted-foreground">{detail.order.customerPhone || "Chưa có số điện thoại"}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Trạng thái xử lý</p>
                <p className="mt-1 font-medium">{getVendorAssignmentStatusLabel(detail.assignment.status)}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                <p className="mt-1 font-medium">{detail.order.customerEmail || "Chưa có email"}</p>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base font-semibold">Sản phẩm được giao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {detail.order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-muted-foreground">{item.fulfillmentType} • Số lượng {item.quantity}</p>
                </div>
                <div className="font-semibold">{formatCurrency(item.lineTotal, settings.ecommerce)}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <PartnerVendorAssignmentPanel
          detailUrl={ROUTES.API.PARTNER.ORDERS.VENDOR_ASSIGNMENT(detail.assignment.id)}
          portalHref={portalHref}
          initialDetail={detail}
        />
      </div>
    </section>
  );
}
