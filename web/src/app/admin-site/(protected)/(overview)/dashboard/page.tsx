import {
  CreditCard,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { AdminRevenueLineChart } from "@/features/admin/components/dashboard/admin-revenue-line-chart";
import { formatCompactVnd, formatVnd } from "@/lib/currency";
import { query } from "@/lib/database";
import { ROUTES } from "@/lib/routes";

type RevenueSummaryRow = {
  paid_revenue_30d: string;
  paid_orders_30d: string;
  pending_orders_30d: string;
  pending_orders: string;
  active_users: string;
  inactive_users: string;
};

type RevenueChartRow = {
  day: string;
  revenue: string;
  orders: string;
};

type RecentOrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  payment_status: string;
  total_amount: string;
  created_at: string;
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}

export default async function AdminDashboardPage() {
  const [summaryResult, revenueResult, recentOrdersResult] = await Promise.all([
    query<RevenueSummaryRow>(`
      SELECT
        COALESCE((
          SELECT SUM(total_amount)
          FROM commerce_orders
          WHERE payment_status = 'paid'
            AND COALESCE(paid_at, created_at) >= NOW() - INTERVAL '30 days'
        ), 0)::text AS paid_revenue_30d,
        (
          SELECT COUNT(*)::text
          FROM commerce_orders
          WHERE payment_status = 'paid'
            AND COALESCE(paid_at, created_at) >= NOW() - INTERVAL '30 days'
        ) AS paid_orders_30d,
        (
          SELECT COUNT(*)::text
          FROM commerce_orders
          WHERE payment_status IN ('unpaid', 'pending')
            AND created_at >= NOW() - INTERVAL '30 days'
        ) AS pending_orders_30d,
        (
          SELECT COUNT(*)::text
          FROM commerce_orders
          WHERE payment_status IN ('unpaid', 'pending')
        ) AS pending_orders,
        (
          SELECT COUNT(*)::text
          FROM users
          WHERE account_status = 'active'
        ) AS active_users,
        (
          SELECT COUNT(*)::text
          FROM users
          WHERE account_status <> 'active'
        ) AS inactive_users
    `),
    query<RevenueChartRow>(`
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
      LEFT JOIN commerce_orders o
        ON date_trunc('day', COALESCE(o.paid_at, o.created_at))::date = days.day
       AND o.payment_status = 'paid'
      GROUP BY days.day
      ORDER BY days.day ASC
    `),
    query<RecentOrderRow>(`
      SELECT
        id,
        order_number,
        customer_name,
        payment_status,
        total_amount::text,
        created_at
      FROM commerce_orders
      ORDER BY created_at DESC
      LIMIT 5
    `),
  ]);

  const summary = summaryResult.rows[0];
  const paidRevenue30d = asNumber(summary?.paid_revenue_30d);
  const paidOrders30d = asNumber(summary?.paid_orders_30d);
  const pendingOrders30d = asNumber(summary?.pending_orders_30d);
  const pendingOrders = asNumber(summary?.pending_orders);
  const activeUsers = asNumber(summary?.active_users);
  const inactiveUsers = asNumber(summary?.inactive_users);

  const chartData = revenueResult.rows.map((item) => ({
    ...item,
    label: formatDayLabel(item.day),
    revenueValue: asNumber(item.revenue),
    orderCount: asNumber(item.orders),
  }));

  const kpis = [
    {
      title: "Doanh thu 30 ngày",
      value: formatCompactVnd(paidRevenue30d),
      detail: formatVnd(paidRevenue30d),
      icon: CreditCard,
      href: ROUTES.ADMIN.PAYMENTS,
    },
    {
      title: "Đơn đã thanh toán",
      value: paidOrders30d.toLocaleString("vi-VN"),
      detail: `${pendingOrders.toLocaleString("vi-VN")} đơn đang chờ xử lý`,
      icon: Package,
      href: ROUTES.ADMIN.ORDERS,
    },
    {
      title: "Đơn chờ 30 ngày",
      value: pendingOrders30d.toLocaleString("vi-VN"),
      detail: `${pendingOrders.toLocaleString("vi-VN")} đơn chờ tổng`,
      icon: ShoppingCart,
      href: ROUTES.ADMIN.ORDERS,
    },
    {
      title: "Tài khoản active",
      value: activeUsers.toLocaleString("vi-VN"),
      detail: `${inactiveUsers.toLocaleString("vi-VN")} tài khoản không active`,
      icon: Users,
      href: ROUTES.ADMIN.USERS,
    },
  ];

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid className="xl:grid-cols-4">
        {kpis.map((item) => (
          <AdminOverviewCard
            key={item.title}
            title={item.title}
            value={item.value}
            description={item.detail}
            icon={item.icon}
            href={item.href}
          />
        ))}
      </AdminOverviewGrid>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.75fr)]">
        <Card className="flex min-h-[380px] flex-col rounded-lg">
          <CardHeader className="pb-3">
            <CardDescription>7 ngày gần nhất</CardDescription>
            <CardTitle>Biểu đồ doanh thu</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pt-0">
            <AdminRevenueLineChart data={chartData} />
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardDescription>5 đơn mới nhất</CardDescription>
            <CardTitle>Đơn hàng gần đây</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentOrdersResult.rows.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Chưa có dữ liệu đơn hàng.
              </div>
            ) : (
              recentOrdersResult.rows.map((order) => (
                <div key={order.id} className="space-y-2 border-b pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{order.order_number}</p>
                      <p className="truncate text-sm text-muted-foreground">{order.customer_name}</p>
                    </div>
                    <span className="shrink-0 font-semibold">{formatVnd(order.total_amount)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span className="capitalize">{formatStatus(order.payment_status)}</span>
                    <span>{formatDateTime(order.created_at)}</span>
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
