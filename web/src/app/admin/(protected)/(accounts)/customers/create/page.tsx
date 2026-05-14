import { ShieldCheck, UserPlus, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { QuickCreateUserForm } from "@/features/admin/components/users/quick-create-user-form";
import { countAdmins, listAccountsByRole, requireAdmin } from "@/lib/auth";
import { getRoleLabel, USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

type AdminCustomersCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminCustomersCreatePage({ searchParams }: AdminCustomersCreatePageProps) {
  await requireAdmin();
  await searchParams;
  const [customers, adminCount] = await Promise.all([
    listAccountsByRole(USER_ROLES.CUSTOMER),
    countAdmins(),
  ]);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid className="md:grid-cols-3 lg:grid-cols-3">
        <AdminOverviewCard title={getRoleLabel(USER_ROLES.CUSTOMER)} value={customers.length} icon={Users} />
        <AdminOverviewCard title={getRoleLabel(USER_ROLES.ADMIN)} value={adminCount} icon={ShieldCheck} />
        <AdminOverviewCard title="Mặc định actor" value="CUSTOMER" description="Tài khoản tạo ở đây sẽ mặc định là CUSTOMER." icon={UserPlus} />
      </AdminOverviewGrid>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Tạo tài khoản khách hàng mới</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickCreateUserForm defaultRole={USER_ROLES.CUSTOMER} returnTo={ROUTES.ADMIN.CUSTOMERS} />
        </CardContent>
      </Card>
    </section>
  );
}
