import Link from "next/link";
import { BadgePercent, ShieldCheck, UserPlus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QuickCreateUserForm } from "@/features/admin/components/users/quick-create-user-form";
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Tổng người dùng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{users.length}</p>
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
            <CardTitle className="text-sm">{getRoleLabel(USER_ROLES.CUSTOMER)}</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{customerCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Quản lý riêng tại trang actor.</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Đối tác + Vendor</CardTitle>
            <BadgePercent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{affiliateCount + vendorCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Affiliate: {affiliateCount} • Vendor: {vendorCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Button variant="outline" render={<Link href={ROUTES.ADMIN.CUSTOMERS}>Mở danh sách khách hàng</Link>} />
        <Button variant="outline" render={<Link href={ROUTES.ADMIN.AFFILIATE_USERS}>Mở danh sách đối tác / CTV</Link>} />
        <Button variant="outline" render={<Link href={ROUTES.ADMIN.VENDORS}>Mở danh sách nhà cung cấp</Link>} />
        <Dialog>
          <DialogTrigger render={<Button />}>
            Tạo người dùng
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo người dùng</DialogTitle>
              <DialogDescription>Tạo tài khoản mới và chọn vai trò phù hợp.</DialogDescription>
            </DialogHeader>
            <QuickCreateUserForm returnTo={ROUTES.ADMIN.USERS} />
          </DialogContent>
        </Dialog>
      </div>

      <UserManagement initialUsers={users} actor={actor} />
    </section>
  );
}
