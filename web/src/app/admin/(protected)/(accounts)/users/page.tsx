import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { countAdmins, listAccounts, requireAdmin } from "@/lib/auth";
import { UserManagement } from "@/features/admin/components/users/user-management";
import { ROUTES } from "@/lib/routes";

type AdminUserPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUserPage({ searchParams }: AdminUserPageProps) {
  const actor = await requireAdmin();
  const users = await listAccounts();
  const adminCount = await countAdmins();
  const userCount = users.length - adminCount;
  await searchParams;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý người dùng</h1>
        </div>
        <Button render={<Link href={ROUTES.ADMIN.USERS_CREATE}>Tạo người dùng</Link>} />
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

      <UserManagement initialUsers={users} actor={actor} />
    </section>
  );
}
