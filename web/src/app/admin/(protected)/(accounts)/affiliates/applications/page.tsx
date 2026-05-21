import { CheckCircle2, Clock3, ShieldAlert, Users } from "lucide-react";

import {
  getAffiliateApplicationSummary,
  listAffiliateApplications,
} from "@/features/affiliate/server/service";
import { AdminAffiliateApplicationsTable } from "@/features/admin/components/affiliates/admin-affiliate-applications-table";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { requireAdmin } from "@/lib/auth";

export default async function AdminAffiliateApplicationsPage() {
  await requireAdmin();
  const [applicationSummary, applications] = await Promise.all([
    getAffiliateApplicationSummary(),
    listAffiliateApplications(),
  ]);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="rounded-md border bg-background p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Hồ sơ Guest Affiliate</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Đây là hồ sơ affiliate gửi từ trang public `/affiliate-apply`, dành cho người chưa đăng nhập. Luồng này khác với customer đã login.
        </p>
      </div>

      <AdminOverviewGrid>
        <AdminOverviewCard title="Chờ review" value={applicationSummary.pendingCount} icon={Clock3} />
        <AdminOverviewCard title="Đã liên hệ" value={applicationSummary.contactedCount} icon={Users} />
        <AdminOverviewCard title="Đã duyệt" value={applicationSummary.approvedCount} icon={CheckCircle2} />
        <AdminOverviewCard title="Từ chối" value={applicationSummary.rejectedCount} icon={ShieldAlert} />
      </AdminOverviewGrid>

      <AdminAffiliateApplicationsTable applications={applications} />
    </section>
  );
}
