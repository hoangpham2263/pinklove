import { BadgePercent, CheckCircle2, Clock3, MousePointerClick, ShieldAlert, TrendingUp, UserCheck, Users } from "lucide-react";

import {
  getAffiliateApplicationSummary,
  getAffiliateProgramSummary,
  listAffiliateConversions,
  listAffiliateAccounts,
  listAffiliateApplications,
} from "@/features/affiliate/server/service";
import { AdminAffiliateApplicationsTable } from "@/features/admin/components/affiliates/admin-affiliate-applications-table";
import { AdminAffiliateConversionsTable } from "@/features/admin/components/affiliates/admin-affiliate-conversions-table";
import { AdminAffiliatesTable } from "@/features/admin/components/affiliates/admin-affiliates-table";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { requireAdmin } from "@/lib/auth";

type AdminAffiliatesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminAffiliatesPage({ searchParams }: AdminAffiliatesPageProps) {
  await requireAdmin();
  await searchParams;
  const [summary, applicationSummary, accounts, applications, conversions] = await Promise.all([
    getAffiliateProgramSummary(),
    getAffiliateApplicationSummary(),
    listAffiliateAccounts(),
    listAffiliateApplications(),
    listAffiliateConversions(),
  ]);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid>
        <AdminOverviewCard title="Guest Pending" value={applicationSummary.pendingCount} icon={Clock3} />
        <AdminOverviewCard title="Contacted" value={applicationSummary.contactedCount} icon={Users} />
        <AdminOverviewCard title="Guest Approved" value={applicationSummary.approvedCount} icon={CheckCircle2} />
        <AdminOverviewCard title="Rejected" value={applicationSummary.rejectedCount} icon={ShieldAlert} />
      </AdminOverviewGrid>

      <AdminAffiliateApplicationsTable applications={applications} />

      <AdminOverviewGrid>
        <AdminOverviewCard title="Account Pending" value={summary.pendingCount} icon={BadgePercent} />
        <AdminOverviewCard title="Active" value={summary.activeCount} icon={UserCheck} />
        <AdminOverviewCard title="Clicks" value={summary.clickCount} icon={MousePointerClick} />
        <AdminOverviewCard title="Conversions" value={summary.conversionCount} icon={TrendingUp} />
      </AdminOverviewGrid>

      <AdminAffiliatesTable accounts={accounts} />

      <AdminAffiliateConversionsTable conversions={conversions} />
    </section>
  );
}
