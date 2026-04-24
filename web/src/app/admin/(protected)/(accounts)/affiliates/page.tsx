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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý affiliate</h1>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Hồ sơ guest chờ duyệt</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{applicationSummary.pendingCount}</CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Đã liên hệ</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{applicationSummary.contactedCount}</CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Guest đã duyệt</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{applicationSummary.approvedCount}</CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Guest bị từ chối</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{applicationSummary.rejectedCount}</CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Hồ sơ affiliate từ khách chưa đăng nhập</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminAffiliateApplicationsTable applications={applications} />
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Chờ duyệt</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.pendingCount}</CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Đang hoạt động</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.activeCount}</CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tổng click</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.clickCount}</CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tổng conversion</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.conversionCount}</CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Tài khoản affiliate đã tạo</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminAffiliatesTable accounts={accounts} />
        </CardContent>
      </Card>
    </section>
  );
}
