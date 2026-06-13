import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleDollarSign, FileText, FolderHeart, LayoutDashboard, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerActionLinkTile, CustomerCreateLinkButton, CustomerLinkButton } from "@/features/customer/ui/customer-buttons";
import { CustomerOverviewCard, CustomerOverviewGrid } from "@/features/customer/ui/customer-overview-card";
import { CustomerRevenueLineChart } from "@/features/customer/ui/customer-revenue-line-chart";
import { requireAppUser } from "@/lib/auth";
import { formatCompactVnd, formatVnd } from "@/lib/currency";
import { query } from "@/lib/database";
import { isProviderRole } from "@/lib/roles";
import { getInvitationPath } from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";
import { listInvitationsForUser } from "@/features/invitations/server/service";
import { getAffiliateAccountForUser } from "@/features/affiliate/server/service";
import { InvitationCard } from "@/features/invitations/components/invitation-card";
import { INVITATION_SITE_TYPES } from "@/features/invitations/types";

function getAffiliateStatusLabel(status: string) {
  if (status === "active") return "Active";
  if (status === "rejected") return "Rejected";
  if (status === "blocked") return "Blocked";
  return "Pending";
}

type CustomerFinanceSummaryRow = {
  paid_spend_30d: string;
  paid_orders_30d: string;
  earned_commission_30d: string;
  conversions_30d: string;
};

type CustomerCommissionChartRow = {
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

export default async function CustomerDashboardPage() {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const [invitations, affiliateAccount, financeSummaryResult, commissionChartResult] = await Promise.all([
    listInvitationsForUser(user.id),
    getAffiliateAccountForUser(user.id),
    query<CustomerFinanceSummaryRow>(
      `
        SELECT
          COALESCE((
            SELECT SUM(total_amount)
            FROM commerce_orders
            WHERE user_id = $1
              AND payment_status = 'paid'
              AND COALESCE(paid_at, created_at) >= NOW() - INTERVAL '30 days'
          ), 0)::text AS paid_spend_30d,
          (
            SELECT COUNT(*)::text
            FROM commerce_orders
            WHERE user_id = $1
              AND payment_status = 'paid'
              AND COALESCE(paid_at, created_at) >= NOW() - INTERVAL '30 days'
          ) AS paid_orders_30d,
          COALESCE((
            SELECT SUM(commission_amount)
            FROM affiliate_conversions
            WHERE affiliate_user_id = $1
              AND status IN ('approved', 'paid')
              AND created_at >= NOW() - INTERVAL '30 days'
          ), 0)::text AS earned_commission_30d,
          (
            SELECT COUNT(*)::text
            FROM affiliate_conversions
            WHERE affiliate_user_id = $1
              AND status IN ('approved', 'paid')
              AND created_at >= NOW() - INTERVAL '30 days'
          ) AS conversions_30d
      `,
      [user.id],
    ),
    query<CustomerCommissionChartRow>(
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
          COALESCE(SUM(conv.commission_amount), 0)::text AS revenue,
          COUNT(conv.id)::text AS orders
        FROM days
        LEFT JOIN affiliate_conversions conv
          ON conv.affiliate_user_id = $1
         AND date_trunc('day', conv.created_at)::date = days.day
         AND conv.status IN ('approved', 'paid')
        GROUP BY days.day
        ORDER BY days.day ASC
      `,
      [user.id],
    ),
  ]);

  const financeSummary = financeSummaryResult.rows[0];
  const paidSpend30d = asNumber(financeSummary?.paid_spend_30d);
  const paidOrders30d = asNumber(financeSummary?.paid_orders_30d);
  const earnedCommission30d = asNumber(financeSummary?.earned_commission_30d);
  const conversions30d = asNumber(financeSummary?.conversions_30d);
  const publishedInvitations = invitations.filter((invitation) => invitation.status === "published").length;
  const draftInvitations = invitations.length - publishedInvitations;
  const codedInvitations = invitations.filter((invitation) => invitation.siteType === INVITATION_SITE_TYPES.CODED).length;
  const builderInvitations = invitations.length - codedInvitations;
  const recentInvitations = invitations.slice(0, 2);
  const providerActor = isProviderRole(user.role);
  const chartData = commissionChartResult.rows.map((item) => ({
    ...item,
    label: formatDayLabel(item.day),
    revenueValue: asNumber(item.revenue),
    orderCount: asNumber(item.orders),
  }));

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Khu khách hàng</h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi thiệp cưới, đơn hàng, lịch hẹn và hồ sơ cá nhân tại một nơi.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <CustomerLinkButton href={ROUTES.TEMPLATES}>Tạo từ mẫu</CustomerLinkButton>
          <CustomerCreateLinkButton href={ROUTES.BUILDER}>Tự tạo thiệp</CustomerCreateLinkButton>
        </div>
      </div>

      <CustomerOverviewGrid>
        <CustomerOverviewCard title="Hoa hồng 30 ngày" value={formatCompactVnd(earnedCommission30d)} description={formatVnd(earnedCommission30d)} icon={CircleDollarSign} />
        <CustomerOverviewCard title="Đơn đã thanh toán 30 ngày" value={paidOrders30d} description={formatVnd(paidSpend30d)} icon={ShoppingBag} />
        <CustomerOverviewCard title="Tổng thiệp" value={invitations.length} description="Toàn bộ thiệp trong tài khoản" icon={LayoutDashboard} />
        <CustomerOverviewCard title="Published" value={publishedInvitations} description={`Draft: ${draftInvitations}`} icon={CheckCircle2} />
        <CustomerOverviewCard title="Thiệp template" value={codedInvitations} icon={FolderHeart} />
        <CustomerOverviewCard title="Thiệp builder" value={builderInvitations} icon={FileText} />
      </CustomerOverviewGrid>

      <Card className="flex min-h-[380px] flex-col rounded-lg">
        <CardHeader className="pb-3">
          <CardDescription>7 ngày gần nhất</CardDescription>
          <CardTitle>Biểu đồ hoa hồng affiliate</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pt-0">
          <CustomerRevenueLineChart data={chartData} />
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Lối tắt thao tác</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <CustomerActionLinkTile href={ROUTES.CUSTOMER.INVITATIONS} label="Thiệp của tôi" description="Quản lý toàn bộ thiệp của bạn." showArrow />
            <CustomerActionLinkTile href={ROUTES.CUSTOMER.ORDERS} label="Đơn hàng" description="Theo dõi checkout, thanh toán và giao hàng." showArrow />
            <CustomerActionLinkTile href={ROUTES.CUSTOMER.CONFIG_PROFILE} label="Hồ sơ" description="Cập nhật hồ sơ và thông tin hiển thị." showArrow />
            <CustomerActionLinkTile href={ROUTES.CUSTOMER.AFFILIATE} label="Affiliate" description="Khu đối tác cho link giới thiệu và hoa hồng." showArrow />
            {providerActor ? (
              <CustomerActionLinkTile href={ROUTES.CUSTOMER.PROVIDER} label="Không gian provider" description="Theo dõi thông tin vận hành dành cho nhà cung cấp." showArrow />
            ) : null}
            <CustomerActionLinkTile href={ROUTES.BUILDER} label="Tạo thiệp mới" description="Bắt đầu với builder hoặc template." showArrow />
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Khu đối tác Affiliate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!affiliateAccount ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Bạn chưa đăng ký affiliate. Khi cần chia sẻ link giới thiệu, hãy bật tài khoản affiliate tại trang riêng.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={affiliateAccount.status === "active" ? "default" : "secondary"}>
                      {getAffiliateStatusLabel(affiliateAccount.status)}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Code</p>
                    <p className="font-semibold">{affiliateAccount.code}</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-sm text-muted-foreground">Clicks</p>
                    <p className="text-2xl font-semibold">{affiliateAccount.clickCount}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-sm text-muted-foreground">Conversions</p>
                    <p className="text-2xl font-semibold">{affiliateAccount.conversionCount}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-sm text-muted-foreground">Commission</p>
                    <p className="text-2xl font-semibold">{formatCompactVnd(affiliateAccount.earnedCommission)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{conversions30d.toLocaleString("vi-VN")} conversion 30 ngày</p>
                  </div>
                </div>
              </>
            )}
            <Button
              variant="outline"
              className="w-full rounded-md"
              render={
                <Link href={ROUTES.CUSTOMER.AFFILIATE}>
                  Mở Affiliate
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              }
            />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Thiệp gần đây</CardTitle>
          <Button
            variant="outline"
            className="rounded-md"
            render={<Link href={ROUTES.CUSTOMER.INVITATIONS}>Xem tất cả</Link>}
          />
        </CardHeader>
        <CardContent>
          {recentInvitations.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Chưa có thiệp nào. Bạn có thể bắt đầu từ mẫu sẵn hoặc builder.
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {recentInvitations.map((invitation) => (
                <InvitationCard key={invitation.id} invitation={invitation} publicHref={getInvitationPath(invitation)} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
