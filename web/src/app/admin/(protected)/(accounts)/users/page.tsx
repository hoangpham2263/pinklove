import { BadgePercent, ShieldCheck, UserPlus, Users } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminDialogCreateTrigger, AdminLinkButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
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
      <AdminOverviewGrid>
        <AdminOverviewCard title="Tổng người dùng" value={users.length} icon={Users} />
        <AdminOverviewCard title={getRoleLabel(USER_ROLES.ADMIN)} value={adminCount} icon={ShieldCheck} />
        <AdminOverviewCard title={getRoleLabel(USER_ROLES.CUSTOMER)} value={customerCount} description="Quản lý riêng tại trang actor." icon={UserPlus} />
        <AdminOverviewCard title="Đối tác + Vendor" value={affiliateCount + vendorCount} description={`Affiliate: ${affiliateCount} • Vendor: ${vendorCount}`} icon={BadgePercent} />
      </AdminOverviewGrid>

      <div className="grid gap-4 md:grid-cols-4">
        <AdminLinkButton href={ROUTES.ADMIN.CUSTOMERS}>Mở danh sách khách hàng</AdminLinkButton>
        <AdminLinkButton href={ROUTES.ADMIN.AFFILIATE_USERS}>Mở danh sách đối tác / CTV</AdminLinkButton>
        <AdminLinkButton href={ROUTES.ADMIN.VENDORS}>Mở danh sách nhà cung cấp</AdminLinkButton>
        <Dialog>
          <AdminDialogCreateTrigger>
            Tạo người dùng
          </AdminDialogCreateTrigger>
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
