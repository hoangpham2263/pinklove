import { Building2 } from "lucide-react";

import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { ProviderAccountCreateForm } from "@/features/admin/components/provider-account-management/provider-account-create-form";
import { listAccountsByRole, requireAdmin } from "@/lib/auth";
import { getRoleLabel, USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

type AdminProviderAccountsCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminProviderAccountsCreatePage({ searchParams }: AdminProviderAccountsCreatePageProps) {
  await requireAdmin();
  const query = (await searchParams) ?? {};
  const returnTo = getQueryValue(query.returnTo) ?? ROUTES.ADMIN.PROVIDER_ACCOUNTS;
  const providerAccounts = await listAccountsByRole(USER_ROLES.PROVIDER);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Tạo xưởng in / nhà cung cấp</h1>
        <p className="text-sm text-muted-foreground">
          Tạo tài khoản provider để đối tác có thể đăng nhập portal, nhận đơn và gửi yêu cầu cung cấp sản phẩm.
        </p>
      </div>

      <AdminOverviewGrid className="md:grid-cols-1 lg:grid-cols-1">
        <AdminOverviewCard title={getRoleLabel(USER_ROLES.PROVIDER)} value={providerAccounts.length} icon={Building2} />
      </AdminOverviewGrid>

      <ProviderAccountCreateForm returnTo={returnTo} />
    </section>
  );
}
