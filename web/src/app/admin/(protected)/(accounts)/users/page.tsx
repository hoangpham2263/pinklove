import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { countAdmins, listAccounts, requireAdmin } from "@/lib/auth";
import { UserManagement } from "@/features/admin/components/users/user-management";
import { getRoleLabel, USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

type AdminUserPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUserPage({ searchParams }: AdminUserPageProps) {
  const actor = await requireAdmin();
  const users = await listAccounts();
  const adminCount = await countAdmins();
  const customerCount = users.filter((user) => user.role === USER_ROLES.CUSTOMER).length;
  const affiliateCount = users.filter((user) => user.role === USER_ROLES.AFFILIATE).length;
  const vendorCount = users.filter((user) => user.role === USER_ROLES.VENDOR).length;
  await searchParams;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý người dùng</h1>
        </div>
        <Button render={<Link href={ROUTES.ADMIN.USERS_CREATE}>Tạo người dùng</Link>} />
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
            <p className="mt-1 text-xs text-muted-foreground">Quản lý riêng tại trang actor.</p>
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

      <div className="grid gap-4 md:grid-cols-3">
        <Button variant="outline" render={<Link href={ROUTES.ADMIN.CUSTOMERS}>Mở danh sách khách hàng</Link>} />
        <Button variant="outline" render={<Link href={ROUTES.ADMIN.AFFILIATE_USERS}>Mở danh sách đối tác / CTV</Link>} />
        <Button variant="outline" render={<Link href={ROUTES.ADMIN.VENDORS}>Mở danh sách nhà cung cấp</Link>} />
      </div>

      <UserManagement initialUsers={users} actor={actor} />
    </section>
  );
}
