import { BadgePercent, MousePointerClick, TrendingUp, UserCheck } from "lucide-react";

import {
  getAffiliateProgramSummary,
  listAffiliateAccounts,
} from "@/features/affiliate/server/service";
import { AdminAffiliatesTable } from "@/features/admin/components/affiliates/admin-affiliates-table";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { requireAdmin } from "@/lib/auth";

export default async function AdminAffiliateAccountsPage() {
  await requireAdmin();
  const [summary, accounts] = await Promise.all([
    getAffiliateProgramSummary(),
    listAffiliateAccounts(),
  ]);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="rounded-md border bg-background p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Duyệt Customer Affiliate</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Đây là nơi duyệt yêu cầu do customer gửi từ `/customer/affiliate`. Tài khoản mới sẽ ở trạng thái chờ duyệt; chuyển sang đang hoạt động để link affiliate bắt đầu hoạt động.
        </p>
      </div>

      <AdminOverviewGrid>
        <AdminOverviewCard title="Chờ duyệt" value={summary.pendingCount} icon={BadgePercent} />
        <AdminOverviewCard title="Đang hoạt động" value={summary.activeCount} icon={UserCheck} />
        <AdminOverviewCard title="Lượt click" value={summary.clickCount} icon={MousePointerClick} />
        <AdminOverviewCard title="Chuyển đổi" value={summary.conversionCount} icon={TrendingUp} />
      </AdminOverviewGrid>

      <AdminAffiliatesTable accounts={accounts} />
    </section>
  );
}
