import { CheckCircle2, ClipboardList, PackageSearch, Store } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminCreateLinkButton, AdminLinkButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { AdminProviderAccountList, type AdminProviderAccountRow } from "@/features/admin/components/provider-accounts/admin-provider-account-list";
import { listProvidersByUserIds } from "@/features/providers/server/service";
import { listProviderOfferingSubmissionsForAdmin } from "@/features/provider-offering-submissions/server/service";
import { countProviderAssignmentsForProvider } from "@/features/provider-orders/server/service";
import { ensureProviderPortalSlug, listAccounts, listAccountsByRole, requireAdmin } from "@/lib/auth";
import { USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

type AdminProviderAccountsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminProviderAccountsPage({ searchParams }: AdminProviderAccountsPageProps) {
  await requireAdmin();
  await searchParams;

  const [accountRows, allUsers, submissions] = await Promise.all([
    listAccountsByRole(USER_ROLES.PROVIDER),
    listAccounts(),
    listProviderOfferingSubmissionsForAdmin(),
  ]);
  const providersByUserId = await listProvidersByUserIds(accountRows.map((provider) => provider.id));

  const providerAccounts: AdminProviderAccountRow[] = await Promise.all(
    accountRows.map(async (account) => {
      const [providerPortalSlug, stats] = await Promise.all([
        account.providerPortalSlug ? Promise.resolve(account.providerPortalSlug) : ensureProviderPortalSlug(account.id),
        countProviderAssignmentsForProvider(account.id),
      ]);
      const providerSubmissions = submissions.filter((submission) => submission.providerId === account.id);
      const pendingOfferings = providerSubmissions.filter((submission) =>
        ["submitted", "under_review", "changes_requested"].includes(submission.reviewStatus)
      ).length;
      const providerRecord = providersByUserId.get(account.id);

      return {
        ...account,
        providerPortalSlug: providerPortalSlug || "",
        providerId: typeof providerRecord?.id === "string" ? providerRecord.id : "",
        providerType: typeof providerRecord?.provider_type === "string" ? providerRecord.provider_type : "supplier",
        providerStatus: typeof providerRecord?.status === "string" ? providerRecord.status : "draft",
        assignmentTotal: stats.total,
        assignmentActive: stats.active,
        assignmentReview: stats.review,
        assignmentCompleted: stats.completed,
        submittedOfferings: providerSubmissions.length,
        pendingOfferings,
      };
    })
  );

  const activeCount = providerAccounts.filter((provider) => provider.accountStatus === "active").length;
  const riskCount = providerAccounts.filter((provider) => provider.accountStatus !== "active").length;
  const totalAssignments = providerAccounts.reduce((sum, provider) => sum + provider.assignmentTotal, 0);
  const totalPendingOfferings = providerAccounts.reduce((sum, provider) => sum + provider.pendingOfferings, 0);
  const roleShare = allUsers.length === 0 ? 0 : Math.round((providerAccounts.length / allUsers.length) * 100);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý nhà cung cấp</h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi provider, portal đăng nhập, hồ sơ sản phẩm và các đơn đã phân công trong một màn hình.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminLinkButton href={ROUTES.ADMIN.PROVIDER_OFFERINGS}>Review sản phẩm provider</AdminLinkButton>
          <AdminCreateLinkButton href={ROUTES.ADMIN.PROVIDER_ACCOUNTS_CREATE}>Tạo nhà cung cấp</AdminCreateLinkButton>
        </div>
      </div>

      <AdminOverviewGrid>
        <AdminOverviewCard title="Tổng provider" value={providerAccounts.length} description={`${roleShare}% tổng tài khoản`} icon={Store} />
        <AdminOverviewCard title="Đang hoạt động" value={activeCount} description={`${riskCount} tài khoản đang bị hạn chế`} icon={CheckCircle2} />
        <AdminOverviewCard title="Đơn đã phân công" value={totalAssignments} description="Tổng đơn provider đang quản lý" icon={ClipboardList} />
        <AdminOverviewCard title="Hồ sơ cần review" value={totalPendingOfferings} description="Submitted / under review / cần bổ sung" icon={PackageSearch} />
      </AdminOverviewGrid>

      <Card className="rounded-lg">
        <CardHeader className="border-b">
          <CardTitle>Danh sách provider</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <AdminProviderAccountList providerAccounts={providerAccounts} />
        </CardContent>
      </Card>
    </section>
  );
}
