import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAffiliateAccounts, getAffiliateProgramSummary } from "@/features/affiliate/server/service";
import { AdminAffiliatesTable } from "@/features/admin/components/affiliates/admin-affiliates-table";
import { requireAdmin } from "@/lib/auth";

type AdminAffiliatesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminAffiliatesPage({ searchParams }: AdminAffiliatesPageProps) {
  await requireAdmin();
  await searchParams;
  const summary = await getAffiliateProgramSummary();
  const accounts = await listAffiliateAccounts();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý affiliate</h1>
      </div>

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

      <AdminAffiliatesTable accounts={accounts} />
    </section>
  );
}
