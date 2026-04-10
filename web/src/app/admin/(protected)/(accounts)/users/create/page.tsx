import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin, listAccounts, countAdmins } from "@/lib/auth";
import { QuickCreateUserForm } from "@/features/admin/components/users/quick-create-user-form";
import { getRoleLabel, USER_ROLES } from "@/lib/roles";

type AdminUserCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUserCreatePage({ searchParams }: AdminUserCreatePageProps) {
  await requireAdmin();
  await searchParams;
  const users = await listAccounts();
  const adminCount = await countAdmins();
  const customerCount = users.filter((user) => user.role === USER_ROLES.CUSTOMER).length;
  const affiliateCount = users.filter((user) => user.role === USER_ROLES.AFFILIATE).length;
  const vendorCount = users.filter((user) => user.role === USER_ROLES.VENDOR).length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tạo người dùng</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tổng người dùng</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{users.length}</p>
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
            <CardTitle className="text-base">{getRoleLabel(USER_ROLES.CUSTOMER)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{customerCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Đối tác + Vendor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{affiliateCount + vendorCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Affiliate: {affiliateCount} • Vendor: {vendorCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Tạo tài khoản mới</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickCreateUserForm />
        </CardContent>
      </Card>
    </section>
  );
}
