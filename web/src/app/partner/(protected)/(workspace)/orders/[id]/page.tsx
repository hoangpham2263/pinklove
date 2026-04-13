import Link from "next/link";
import { notFound } from "next/navigation";

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

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7">
      {query.saved ? <PageToast message="Đã lưu cập nhật vendor." variant="success" cleanupKeys={["saved"]} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{detail.order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">{detail.order.customerName} • {getVendorAssignmentStatusLabel(detail.assignment.status)}</p>
        </div>
        <Button
          variant="outline"
          render={<Link href={portalSlug ? ROUTES.PARTNER.PORTAL(portalSlug) : ROUTES.PARTNER.ROOT}>Quay lại portal</Link>}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sản phẩm được giao</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {detail.order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">{item.productName}</p>
                <p className="text-sm text-muted-foreground">{item.fulfillmentType} • SL {item.quantity}</p>
              </div>
              <div className="font-semibold">{formatCurrency(item.lineTotal, settings.ecommerce)}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin khách hàng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="font-medium">Khách:</span> {detail.order.customerName}</p>
          <p><span className="font-medium">Email:</span> {detail.order.customerEmail || "Chưa có"}</p>
          <p><span className="font-medium">Điện thoại:</span> {detail.order.customerPhone || "Chưa có"}</p>
          <p><span className="font-medium">Ghi chú đơn:</span> {detail.order.notes || "Không có"}</p>
        </CardContent>
      </Card>

      <PartnerVendorAssignmentPanel
        detailUrl={`/api/partner/vendor-assignments/${detail.assignment.id}`}
        submitUrl={ROUTES.API.PARTNER.ORDERS.UPDATE}
        portalHref={portalSlug ? ROUTES.PARTNER.PORTAL(portalSlug) : ROUTES.PARTNER.ROOT}
        initialDetail={detail}
      />
    </section>
  );
}
