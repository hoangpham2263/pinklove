import { CheckCircle2, Clock3, ShieldAlert, Users } from "lucide-react";

import { AdminLinkButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { AdminProviderApplicationsTable } from "@/features/provider-applications/components/admin-provider-applications-table";
import {
  getProviderApplicationSummary,
  listProviderApplications,
} from "@/features/provider-applications/server/service";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminProviderApplicationsPage() {
  await requireAdmin();
  const [applicationSummary, applications] = await Promise.all([
    getProviderApplicationSummary(),
    listProviderApplications(),
  ]);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="rounded-md border bg-background p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Hồ sơ đăng ký provider</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Đây là hồ sơ customer gửi từ <code>{ROUTES.CUSTOMER.PROVIDER_APPLY}</code>. Khi duyệt approved, account tương ứng sẽ được mở role PROVIDER để vào Provider Center.
        </p>
      </div>

      <AdminOverviewGrid>
        <AdminOverviewCard title="Chờ review" value={applicationSummary.pendingCount} icon={Clock3} />
        <AdminOverviewCard title="Đã liên hệ" value={applicationSummary.contactedCount} icon={Users} />
        <AdminOverviewCard title="Đã duyệt" value={applicationSummary.approvedCount} icon={CheckCircle2} />
        <AdminOverviewCard title="Từ chối" value={applicationSummary.rejectedCount} icon={ShieldAlert} />
      </AdminOverviewGrid>

      <div className="flex flex-wrap justify-end gap-2">
        <AdminLinkButton href={ROUTES.ADMIN.PROVIDER_ACCOUNTS}>Xem provider accounts</AdminLinkButton>
      </div>

      <AdminProviderApplicationsTable applications={applications} />
    </section>
  );
}
