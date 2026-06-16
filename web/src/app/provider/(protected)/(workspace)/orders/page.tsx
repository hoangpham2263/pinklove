import { PackageCheck } from "lucide-react";

import { ProviderOverviewCard, ProviderOverviewGrid } from "@/features/provider-orders/components/provider-overview-card";
import { ProviderEmptyState, ProviderPage, ProviderPageHeader } from "@/features/provider-orders/components/provider-page";
import { ProviderTableActionButton, ProviderTableActions } from "@/features/provider-orders/components/provider-table-actions";
import { countProviderAssignmentsForProvider, listProviderOrderSummariesForProvider } from "@/features/provider-orders/server/service";
import { getUserProfile, requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getPaymentStatusLabel, getProviderAssignmentStatusLabel } from "@/lib/status-labels";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export default async function ProviderOrdersPage() {
  const provider = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const [profile, stats, assignments] = await Promise.all([
    getUserProfile(provider.id),
    countProviderAssignmentsForProvider(provider.id),
    listProviderOrderSummariesForProvider(provider.id),
  ]);
  const providerName = profile.displayName || profile.fullName || provider.username;

  return (
    <ProviderPage>
      <ProviderPageHeader
        title="Đơn được giao"
        description={`Danh sách đơn hàng admin đã giao cho ${providerName}. Provider chỉ nhìn thấy và cập nhật phần việc được phân công.`}
      />

      <ProviderOverviewGrid>
        <ProviderOverviewCard title="Tổng đơn" value={stats.total} />
        <ProviderOverviewCard title="Đang xử lý" value={stats.active} />
        <ProviderOverviewCard title="Chờ review" value={stats.review} />
        <ProviderOverviewCard title="Hoàn tất" value={stats.completed} />
      </ProviderOverviewGrid>

      <div className="space-y-4">
        <div className="flex min-w-0 items-center gap-2">
          <PackageCheck className="h-4 w-4" />
          <h2 className="text-xl font-semibold tracking-tight">Danh sách đơn được giao</h2>
        </div>
        {assignments.length === 0 ? (
          <ProviderEmptyState>Chưa có đơn hàng nào được giao cho provider này.</ProviderEmptyState>
        ) : (
          <div className="space-y-3">
            {assignments.map((entry) => (
              <div key={entry.assignment.id} className="grid gap-3 rounded-md border p-4 lg:grid-cols-[minmax(0,1fr)_220px_190px] lg:items-center">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{entry.order.orderNumber}</p>
                    {entry.order.metadata.requestVatInvoice ? (
                      <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        VAT
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {entry.order.customerName} • {entry.items.map((item) => `${item.offeringName} x${item.quantity}`).join(", ")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Trạng thái provider: {getProviderAssignmentStatusLabel(entry.assignment.status)} • Thanh toán: {getPaymentStatusLabel(entry.order.paymentStatus)}
                  </p>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Cập nhật: {formatDateTime(entry.assignment.updatedAt)}</p>
                  <p>{entry.lastEvent?.message || "Chưa có activity"}</p>
                </div>
                <div className="flex justify-start lg:justify-end">
                  <ProviderTableActions>
                    <ProviderTableActionButton action="view" label="Mở chi tiết" href={ROUTES.PROVIDER.ORDER(entry.assignment.id)} />
                  </ProviderTableActions>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProviderPage>
  );
}
