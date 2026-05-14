import { BadgePercent, CheckCircle2, Clock3, MousePointerClick, ShieldAlert, TrendingUp, UserCheck, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAffiliateApplicationSummary,
  getAffiliateProgramSummary,
  listAffiliateAccounts,
  listAffiliateApplications,
} from "@/features/affiliate/server/service";
import { AdminAffiliateApplicationsTable } from "@/features/admin/components/affiliates/admin-affiliate-applications-table";
import { AdminAffiliatesTable } from "@/features/admin/components/affiliates/admin-affiliates-table";
import { requireAdmin } from "@/lib/auth";

type AdminAffiliatesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminAffiliatesPage({ searchParams }: AdminAffiliatesPageProps) {
  await requireAdmin();
  await searchParams;
  const [summary, applicationSummary, accounts, applications] = await Promise.all([
    getAffiliateProgramSummary(),
    getAffiliateApplicationSummary(),
    listAffiliateAccounts(),
    listAffiliateApplications(),
  ]);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Guest Pending</CardTitle>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{applicationSummary.pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Contacted</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{applicationSummary.contactedCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Guest Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{applicationSummary.approvedCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Rejected</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{applicationSummary.rejectedCount}</p>
          </CardContent>
        </Card>
      </div>

      <AdminAffiliateApplicationsTable applications={applications} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Account Pending</CardTitle>
            <BadgePercent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{summary.pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{summary.activeCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{summary.clickCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{summary.conversionCount}</p>
          </CardContent>
        </Card>
      </div>

      <AdminAffiliatesTable accounts={accounts} />
    </section>
  );
}
