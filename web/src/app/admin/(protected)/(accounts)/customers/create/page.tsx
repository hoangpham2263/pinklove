import { ShieldCheck, UserPlus, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">{getRoleLabel(USER_ROLES.CUSTOMER)}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{customers.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">{getRoleLabel(USER_ROLES.ADMIN)}</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{adminCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Mặc định actor</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Tài khoản tạo ở đây sẽ mặc định là `CUSTOMER`.
          </CardContent>
        </Card>
      </div>

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
