import { BadgePercent, CheckCircle2, Clock3, MousePointerClick, ShieldAlert, TrendingUp, UserCheck, Users } from "lucide-react";

import {
  getAffiliateApplicationSummary,
  getAffiliateProgramSummary,
} from "@/features/affiliate/server/service";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminAffiliatesPage() {
  await requireAdmin();
  const [summary, applicationSummary] = await Promise.all([
    getAffiliateProgramSummary(),
    getAffiliateApplicationSummary(),
  ]);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="rounded-md border bg-background p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Affiliate Overview</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Luồng customer đăng ký ở <code>{ROUTES.CUSTOMER.AFFILIATE}</code> sẽ tạo tài khoản affiliate trạng thái chờ duyệt và được duyệt tại mục Duyệt Customer Affiliate. Hồ sơ guest từ trang public <code>{ROUTES.AFFILIATE_APPLY}</code> nằm riêng ở mục Hồ sơ Guest Affiliate.
        </p>
      </div>

      <AdminOverviewGrid>
        <AdminOverviewCard
          title="Duyệt Customer Affiliate"
          value={summary.pendingCount}
          description="Customer đã login gửi yêu cầu, admin bật active tại đây."
          icon={BadgePercent}
          href={ROUTES.ADMIN.AFFILIATE_ACCOUNTS}
          hrefLabel="Mở trang duyệt"
        />
        <AdminOverviewCard
          title="Affiliate đang active"
          value={summary.activeCount}
          description="Tài khoản có link hoạt động."
          icon={UserCheck}
          href={ROUTES.ADMIN.AFFILIATE_ACCOUNTS}
          hrefLabel="Quản lý tài khoản"
        />
        <AdminOverviewCard
          title="Hồ sơ guest chờ review"
          value={applicationSummary.pendingCount}
          description="Đơn đăng ký từ trang public."
          icon={Clock3}
          href={ROUTES.ADMIN.AFFILIATE_APPLICATIONS}
          hrefLabel="Duyệt hồ sơ guest"
        />
        <AdminOverviewCard
          title="Conversion"
          value={summary.conversionCount}
          description="Đơn hàng ghi nhận qua link affiliate."
          icon={TrendingUp}
          href={ROUTES.ADMIN.AFFILIATE_CONVERSIONS}
          hrefLabel="Quản lý hoa hồng"
        />
      </AdminOverviewGrid>

      <AdminOverviewGrid>
        <AdminOverviewCard title="Guest contacted" value={applicationSummary.contactedCount} icon={Users} />
        <AdminOverviewCard title="Guest approved" value={applicationSummary.approvedCount} icon={CheckCircle2} />
        <AdminOverviewCard title="Guest rejected" value={applicationSummary.rejectedCount} icon={ShieldAlert} />
        <AdminOverviewCard title="Clicks toàn hệ thống" value={summary.clickCount} icon={MousePointerClick} />
      </AdminOverviewGrid>
    </section>
  );
}
