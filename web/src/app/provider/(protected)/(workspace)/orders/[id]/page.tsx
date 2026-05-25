import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageToast } from "@/components/common/page-toast";
import { Button } from "@/components/ui/button";
import { ProviderAssignmentPanel } from "@/features/provider-orders/components/provider-assignment-panel";
import { ProviderPage, ProviderPageHeader, ProviderSectionCard } from "@/features/provider-orders/components/provider-page";
import { getProviderOrderDetailForProvider } from "@/features/provider-orders/server/service";
import { requireProvider } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { ROUTES } from "@/lib/routes";
import { getProviderAssignmentStatusLabel } from "@/lib/status-labels";
import { getSystemSettings } from "@/lib/system-settings";

export default async function ProviderOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const provider = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const [detail, settings] = await Promise.all([
    getProviderOrderDetailForProvider(provider.id, id),
    getSystemSettings(),
  ]);

  if (!detail) {
    notFound();
  }

  const portalHref = ROUTES.PROVIDER.ROOT;

  return (
    <ProviderPage>
      {query.saved ? <PageToast message="Đã lưu cập nhật." variant="success" cleanupKeys={["saved"]} /> : null}

      <ProviderPageHeader
        title={detail.order.orderNumber}
        description="Theo dõi tiến độ xử lý đơn hàng và cập nhật ngay khi có thay đổi để đội ngũ quản lý nắm tiến độ theo thời gian thực."
        actions={
          <Button
            variant="outline"
            className="gap-2"
            render={
              <Link href={ROUTES.PROVIDER.ORDERS}>
                <ArrowLeft className="h-4 w-4" />
                Danh sách đơn hàng
              </Link>
            }
          />
        }
      />

      <div className="grid gap-3 rounded-md border bg-background p-4 text-sm md:grid-cols-3">
        <div className="rounded-md border p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Khách hàng</p>
          <p className="mt-1 font-medium">{detail.order.customerName}</p>
          <p className="text-muted-foreground">{detail.order.customerPhone || "Chưa có số điện thoại"}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Trạng thái xử lý</p>
          <p className="mt-1 font-medium">{getProviderAssignmentStatusLabel(detail.assignment.status)}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
          <p className="mt-1 font-medium">{detail.order.customerEmail || "Chưa có email"}</p>
        </div>
      </div>

      <ProviderSectionCard title="Sản phẩm được giao" contentClassName="space-y-3">
        {detail.order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="font-medium">{item.offeringName}</p>
              <p className="text-sm text-muted-foreground">{item.fulfillmentType} • Số lượng {item.quantity}</p>
            </div>
            <div className="font-semibold">{formatCurrency(item.lineTotal, settings.ecommerce)}</div>
          </div>
        ))}
      </ProviderSectionCard>

      <ProviderAssignmentPanel
        detailUrl={ROUTES.API.PROVIDER.ORDERS.PROVIDER_ASSIGNMENT(detail.assignment.id)}
        portalHref={portalHref}
        initialDetail={detail}
      />
    </ProviderPage>
  );
}
