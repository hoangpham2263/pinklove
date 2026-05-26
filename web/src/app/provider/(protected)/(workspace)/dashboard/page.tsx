import { CircleDollarSign, PackageCheck, PackagePlus, ShoppingBag, UserRound } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProviderActionLinkTile, ProviderLinkButton } from "@/features/provider-orders/components/provider-buttons";
import { ProviderOverviewCard, ProviderOverviewGrid } from "@/features/provider-orders/components/provider-overview-card";
import { ProviderEmptyState, ProviderPage, ProviderPageHeader } from "@/features/provider-orders/components/provider-page";
import { ProviderRevenueLineChart } from "@/features/provider-orders/components/provider-revenue-line-chart";
import { countProviderAssignmentsForProvider, listProviderOrderSummariesForProvider } from "@/features/provider-orders/server/service";
import { getUserProfile, requireProvider } from "@/lib/auth";
import { formatCompactVnd, formatVnd } from "@/lib/currency";
import { query } from "@/lib/database";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

type ProviderRevenueSummaryRow = {
  paid_revenue_30d: string;
  paid_orders_30d: string;
  pending_orders_30d: string;
};

type ProviderRevenueChartRow = {
  day: string;
  revenue: string;
  orders: string;
};

function asNumber(value: string | undefined) {
  return Number(value ?? "0");
}

function formatDayLabel(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export default async function ProviderDashboardPage() {
  const provider = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const [profile, stats, assignments, settings, revenueSummaryResult, revenueChartResult] = await Promise.all([
    getUserProfile(provider.id),
    countProviderAssignmentsForProvider(provider.id),
    listProviderOrderSummariesForProvider(provider.id),
    getSystemSettings(),
    query<ProviderRevenueSummaryRow>(
      `
        SELECT
          COALESCE(SUM(o.total_amount) FILTER (
            WHERE o.payment_status = 'paid'
              AND COALESCE(o.paid_at, o.created_at) >= NOW() - INTERVAL '30 days'
          ), 0)::text AS paid_revenue_30d,
          COUNT(o.id) FILTER (
            WHERE o.payment_status = 'paid'
              AND COALESCE(o.paid_at, o.created_at) >= NOW() - INTERVAL '30 days'
          )::text AS paid_orders_30d,
          COUNT(o.id) FILTER (
            WHERE o.payment_status IN ('unpaid', 'pending')
              AND o.created_at >= NOW() - INTERVAL '30 days'
          )::text AS pending_orders_30d
        FROM provider_order_assignments assignment
        JOIN commerce_orders o ON o.id = assignment.order_id
        WHERE assignment.provider_user_id = $1
      `,
      [provider.id],
    ),
    query<ProviderRevenueChartRow>(
      `
        WITH days AS (
          SELECT generate_series(
            date_trunc('day', NOW() - INTERVAL '6 days'),
            date_trunc('day', NOW()),
            INTERVAL '1 day'
          )::date AS day
        )
        SELECT
          to_char(days.day, 'YYYY-MM-DD') AS day,
          COALESCE(SUM(o.total_amount), 0)::text AS revenue,
          COUNT(o.id)::text AS orders
        FROM days
        LEFT JOIN provider_order_assignments assignment
          ON assignment.provider_user_id = $1
        LEFT JOIN commerce_orders o
          ON o.id = assignment.order_id
         AND date_trunc('day', COALESCE(o.paid_at, o.created_at))::date = days.day
         AND o.payment_status = 'paid'
        GROUP BY days.day
        ORDER BY days.day ASC
      `,
      [provider.id],
    ),
  ]);
  const providerName = profile.displayName || profile.fullName || provider.username;
  const portalHref = ROUTES.PROVIDER.ROOT;
  const revenueSummary = revenueSummaryResult.rows[0];
  const paidRevenue30d = asNumber(revenueSummary?.paid_revenue_30d);
  const paidOrders30d = asNumber(revenueSummary?.paid_orders_30d);
  const pendingOrders30d = asNumber(revenueSummary?.pending_orders_30d);
  const chartData = revenueChartResult.rows.map((item) => ({
    ...item,
    label: formatDayLabel(item.day),
    revenueValue: asNumber(item.revenue),
    orderCount: asNumber(item.orders),
  }));

  return (
    <ProviderPage>
      <ProviderPageHeader
        title="Dashboard provider"
        description={`Workspace của ${providerName} trong ${settings.branding.siteName}. Theo dõi đơn, dịch vụ/sản phẩm, doanh thu liên quan và cấu hình tài khoản.`}
        actions={<ProviderLinkButton href={portalHref}>Mở portal công khai</ProviderLinkButton>}
      />

      <ProviderOverviewGrid className="xl:grid-cols-4">
        <ProviderOverviewCard title="Doanh thu liên quan 30 ngày" value={formatCompactVnd(paidRevenue30d)} description={formatVnd(paidRevenue30d)} icon={CircleDollarSign} />
        <ProviderOverviewCard title="Đơn đã thanh toán" value={paidOrders30d.toLocaleString("vi-VN")} description={`${pendingOrders30d.toLocaleString("vi-VN")} đơn chờ 30 ngày`} icon={ShoppingBag} />
        <ProviderOverviewCard title="Đang xử lý" value={stats.active} description={`${stats.total} tổng đơn được giao`} icon={PackageCheck} />
        <ProviderOverviewCard title="Hoàn tất" value={stats.completed} description={`${stats.review} đơn chờ review`} icon={PackageCheck} />
      </ProviderOverviewGrid>

      <Card className="flex min-h-[380px] flex-col rounded-lg">
        <CardHeader className="pb-3">
          <CardDescription>7 ngày gần nhất</CardDescription>
          <CardTitle>Biểu đồ doanh thu liên quan</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pt-0">
          <ProviderRevenueLineChart data={chartData} />
        </CardContent>
      </Card>

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
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{entry.order.orderNumber}</p>
                  {entry.order.metadata.requestVatInvoice ? (
                    <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      VAT
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-muted-foreground">{entry.order.customerName}</p>
              </div>
            ))}
            {assignments.length === 0 ? <ProviderEmptyState className="p-4">Chưa có đơn được giao.</ProviderEmptyState> : null}
            <ProviderActionLinkTile href={ROUTES.PROVIDER.ORDERS} label="Mở tất cả đơn" showArrow />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PackagePlus className="h-4 w-4" />
              Dịch vụ/sản phẩm
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Provider có thể tạo yêu cầu dịch vụ/sản phẩm, chỉnh sửa và gửi admin duyệt.</p>
            <ProviderActionLinkTile href={ROUTES.PROVIDER.OFFERINGS} label="Mở yêu cầu dịch vụ/sản phẩm" showArrow />
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
            <ProviderActionLinkTile href={ROUTES.PROVIDER.CONFIG_ACCOUNT} label="Mở tài khoản" showArrow />
          </CardContent>
        </Card>
      </div>
    </ProviderPage>
  );
}
