import { PackageCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default async function PartnerOrdersPage() {
  const provider = await requireProvider(ROUTES.PARTNER.LOGIN);
  const [profile, stats, assignments] = await Promise.all([
    getUserProfile(provider.id),
    countProviderAssignmentsForProvider(provider.id),
    listProviderOrderSummariesForProvider(provider.id),
  ]);
  const providerName = profile.displayName || profile.fullName || provider.username;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="rounded-md border bg-background p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Đơn được giao</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Danh sách đơn hàng admin đã giao cho {providerName}. Provider chỉ nhìn thấy và cập nhật phần việc được phân công.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Tổng đơn</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{stats.total}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Đang xử lý</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{stats.active}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Chờ review</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{stats.review}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Hoàn tất</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{stats.completed}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <PackageCheck className="h-4 w-4" />
            Danh sách đơn được giao
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-5">
          {assignments.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              Chưa có đơn hàng nào được giao cho provider này.
            </div>
          ) : (
            assignments.map((entry) => (
              <div key={entry.assignment.id} className="grid gap-3 rounded-md border p-4 lg:grid-cols-[minmax(0,1fr)_220px_190px] lg:items-center">
                <div className="space-y-1">
                  <p className="font-medium">{entry.order.orderNumber}</p>
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
                    <ProviderTableActionButton action="view" label="Mở chi tiết" href={ROUTES.PARTNER.ORDER(entry.assignment.id)} />
                  </ProviderTableActions>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
