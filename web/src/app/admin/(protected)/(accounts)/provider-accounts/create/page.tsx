import { Building2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { QuickCreateUserForm } from "@/features/admin/components/users/quick-create-user-form";
import { listAccountsByRole, requireAdmin } from "@/lib/auth";
import { getRoleLabel, USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

type AdminProviderAccountsCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminProviderAccountsCreatePage({ searchParams }: AdminProviderAccountsCreatePageProps) {
  await requireAdmin();
  await searchParams;
  const providerAccounts = await listAccountsByRole(USER_ROLES.PROVIDER);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tạo xưởng in / nhà cung cấp</h1>
      </div>

      <AdminOverviewGrid className="md:grid-cols-1 lg:grid-cols-1">
        <AdminOverviewCard title={getRoleLabel(USER_ROLES.PROVIDER)} value={providerAccounts.length} icon={Building2} />
      </AdminOverviewGrid>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Tạo tài khoản nhà cung cấp</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickCreateUserForm defaultRole={USER_ROLES.PROVIDER} returnTo={ROUTES.ADMIN.PROVIDER_ACCOUNTS} />
        </CardContent>
      </Card>
    </section>
  );
}
