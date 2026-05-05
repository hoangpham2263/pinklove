import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  FileText,
  Image as ImageIcon,
  LayoutTemplate,
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
import { AdminRevenueLineChart } from "@/features/admin/components/dashboard/admin-revenue-line-chart";
import { query } from "@/lib/database";
import { ROUTES } from "@/lib/routes";

type RevenueSummaryRow = {
  paid_revenue_30d: string;
  paid_orders_30d: string;
  pending_orders_30d: string;
  pending_orders: string;
  published_invitations: string;
  draft_invitations: string;
  published_products: string;
  draft_products: string;
  published_posts: string;
  published_pages: string;
  draft_posts: string;
  draft_pages: string;
  active_users: string;
  inactive_users: string;
  media_assets: string;
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
  status: string;
  payment_status: string;
  total_amount: string;
  created_at: string;
};

function asNumber(value: string | undefined) {
  return Number(value ?? "0");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString("vi-VN");
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
          FROM wedding_sites
          WHERE status = 'published'
        ) AS published_invitations,
        (
          SELECT COUNT(*)::text
          FROM wedding_sites
          WHERE status = 'draft'
        ) AS draft_invitations,
        (
          SELECT COUNT(*)::text
          FROM products
          WHERE status = 'published'
        ) AS published_products,
        (
          SELECT COUNT(*)::text
          FROM products
          WHERE status = 'draft'
        ) AS draft_products,
        (
          SELECT COUNT(*)::text
          FROM blog_posts
          WHERE status = 'published'
        ) AS published_posts,
        (
          SELECT COUNT(*)::text
          FROM managed_pages
          WHERE status = 'published'
        ) AS published_pages,
        (
          SELECT COUNT(*)::text
          FROM blog_posts
          WHERE status = 'draft'
        ) AS draft_posts,
        (
          SELECT COUNT(*)::text
          FROM managed_pages
          WHERE status = 'draft'
        ) AS draft_pages,
        (
          SELECT COUNT(*)::text
          FROM users
          WHERE account_status = 'active'
        ) AS active_users,
        (
          SELECT COUNT(*)::text
          FROM users
          WHERE account_status <> 'active'
        ) AS inactive_users,
        (
          SELECT COUNT(*)::text
          FROM media_assets
        ) AS media_assets
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
        status,
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
  const publishedInvitations = asNumber(summary?.published_invitations);
  const draftInvitations = asNumber(summary?.draft_invitations);
  const publishedProducts = asNumber(summary?.published_products);
  const draftProducts = asNumber(summary?.draft_products);
  const publishedContent = asNumber(summary?.published_posts) + asNumber(summary?.published_pages);
  const draftContent = asNumber(summary?.draft_posts) + asNumber(summary?.draft_pages);
  const activeUsers = asNumber(summary?.active_users);
  const inactiveUsers = asNumber(summary?.inactive_users);
  const mediaAssets = asNumber(summary?.media_assets);

  const chartData = revenueResult.rows.map((item) => ({
    ...item,
    label: formatDayLabel(item.day),
    revenueValue: asNumber(item.revenue),
    orderCount: asNumber(item.orders),
  }));

  const kpis = [
    {
      title: "Doanh thu 30 ngày",
      value: formatCompactCurrency(paidRevenue30d),
      detail: formatCurrency(paidRevenue30d),
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
    {
      title: "Thiệp đang chạy",
      value: publishedInvitations.toLocaleString("vi-VN"),
      detail: `${draftInvitations.toLocaleString("vi-VN")} thiệp còn draft`,
      icon: LayoutTemplate,
    },
    {
      title: "Catalog đang chạy",
      value: publishedProducts.toLocaleString("vi-VN"),
      detail: `${draftProducts.toLocaleString("vi-VN")} sản phẩm còn ở draft`,
      icon: FileText,
      href: ROUTES.ADMIN.PRODUCT_LIST,
    },
    {
      title: "Nội dung live",
      value: publishedContent.toLocaleString("vi-VN"),
      detail: `${draftContent.toLocaleString("vi-VN")} nội dung còn draft`,
      icon: FileText,
      href: ROUTES.ADMIN.PAGES,
    },
    {
      title: "Media assets",
      value: mediaAssets.toLocaleString("vi-VN"),
      detail: "Tệp đang có trong thư viện",
      icon: ImageIcon,
      href: ROUTES.ADMIN.MEDIA,
    },
  ];

  const quickLinks = [
    { label: "Đơn hàng", href: ROUTES.ADMIN.ORDERS },
    { label: "Thanh toán", href: ROUTES.ADMIN.PAYMENTS },
    { label: "Sản phẩm", href: ROUTES.ADMIN.PRODUCT_LIST },
    { label: "Blog", href: ROUTES.ADMIN.BLOG_POSTS },
    { label: "Pages", href: ROUTES.ADMIN.PAGES },
    { label: "Cấu hình", href: ROUTES.ADMIN.CONFIG },
  ];

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title} className="rounded-lg">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardDescription>{item.title}</CardDescription>
                    <CardTitle className="mt-2 text-3xl">{item.value}</CardTitle>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-2.5">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{item.detail}</p>
                {item.href ? (
                  <Link href={item.href} className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary">
                    Xem khu vực
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <Card className="flex min-h-[380px] flex-col rounded-lg">
          <CardHeader className="pb-3">
            <CardDescription>7 ngày gần nhất</CardDescription>
            <CardTitle>Biểu đồ doanh thu</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pt-0">
            <AdminRevenueLineChart data={chartData} />
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="rounded-lg">
            <CardHeader>
              <CardDescription>Nội dung và catalog</CardDescription>
              <CardTitle>Trạng thái xuất bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm text-muted-foreground">Nội dung đang live</span>
                <span className="text-lg font-semibold">{publishedContent}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm text-muted-foreground">Nội dung còn draft</span>
                <span className="text-lg font-semibold">{draftContent}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm text-muted-foreground">Sản phẩm live</span>
                <span className="text-lg font-semibold">{publishedProducts}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm text-muted-foreground">Sản phẩm draft</span>
                <span className="text-lg font-semibold">{draftProducts}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm text-muted-foreground">Thiệp live</span>
                <span className="text-lg font-semibold">{publishedInvitations}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm text-muted-foreground">Thiệp draft</span>
                <span className="text-lg font-semibold">{draftInvitations}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardDescription>Thao tác nhanh</CardDescription>
              <CardTitle>Điều hướng</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {quickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <span>{item.label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardDescription>Đơn mới nhất</CardDescription>
          <CardTitle>Hoạt động gần đây</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentOrdersResult.rows.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Chưa có dữ liệu đơn hàng để hiển thị.
            </div>
          ) : (
            recentOrdersResult.rows.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">{order.order_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.customer_name} • {formatDateTime(order.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-muted px-2.5 py-1 capitalize text-muted-foreground">
                    {formatStatus(order.status)}
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1 capitalize text-muted-foreground">
                    {formatStatus(order.payment_status)}
                  </span>
                  <span className="font-semibold">{formatCurrency(asNumber(order.total_amount))}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
