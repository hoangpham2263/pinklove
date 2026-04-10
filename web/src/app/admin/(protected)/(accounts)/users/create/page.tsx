import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin, listAccounts, countAdmins } from "@/lib/auth";
import { QuickCreateUserForm } from "@/features/admin/components/users/quick-create-user-form";

type AdminUserCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUserCreatePage({ searchParams }: AdminUserCreatePageProps) {
  await requireAdmin();
  await searchParams;
  const users = await listAccounts();
  const adminCount = await countAdmins();
  const userCount = users.length - adminCount;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tạo người dùng</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
            <CardTitle className="text-base">Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{adminCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">User</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{userCount}</p>
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
