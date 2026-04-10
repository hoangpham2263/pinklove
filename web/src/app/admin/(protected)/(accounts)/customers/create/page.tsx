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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tạo khách hàng</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{getRoleLabel(USER_ROLES.CUSTOMER)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{customers.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{getRoleLabel(USER_ROLES.ADMIN)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{adminCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Mặc định actor</CardTitle>
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
