import { Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { QuickCreateUserForm } from "@/features/admin/components/users/quick-create-user-form";
import { listAccountsByRole, requireAdmin } from "@/lib/auth";
import { getRoleLabel, USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

type AdminAffiliateUsersCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminAffiliateUsersCreatePage({ searchParams }: AdminAffiliateUsersCreatePageProps) {
  await requireAdmin();
  await searchParams;
  const accounts = await listAccountsByRole(USER_ROLES.AFFILIATE);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid className="md:grid-cols-1 lg:grid-cols-1">
        <AdminOverviewCard title={getRoleLabel(USER_ROLES.AFFILIATE)} value={accounts.length} icon={Users} />
      </AdminOverviewGrid>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Tạo tài khoản đối tác / CTV</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickCreateUserForm defaultRole={USER_ROLES.AFFILIATE} returnTo={ROUTES.ADMIN.AFFILIATE_USERS} />
        </CardContent>
      </Card>
    </section>
  );
}
