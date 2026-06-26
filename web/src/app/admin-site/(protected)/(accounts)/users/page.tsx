import { BadgePercent, ShieldCheck, UserPlus, Users } from "lucide-react";

import { AdminCreateLinkButton, AdminLinkButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { countAdmins, listAccounts, requireAdminPermission } from "@/lib/auth";
import { UserManagement } from "@/features/admin/components/users/user-management";
import { getRoleLabel, USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

type AdminUserPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUserPage({ searchParams }: AdminUserPageProps) {
  const actor = await requireAdminPermission("accounts.manage");
  const users = await listAccounts();
  const adminCount = await countAdmins();
  const customerCount = users.filter((user) => user.role === USER_ROLES.CUSTOMER).length;
  const affiliateCount = users.filter((user) => user.role === USER_ROLES.AFFILIATE).length;
  const providerCount = users.filter((user) => user.role === USER_ROLES.PROVIDER).length;
  await searchParams;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid>
        <AdminOverviewCard title="Tổng người dùng" value={users.length} icon={Users} />
        <AdminOverviewCard title={getRoleLabel(USER_ROLES.ADMIN)} value={adminCount} icon={ShieldCheck} />
        <AdminOverviewCard title={getRoleLabel(USER_ROLES.CUSTOMER)} value={customerCount} description="Quản lý riêng tại trang actor." icon={UserPlus} />
        <AdminOverviewCard title="Affiliate + Provider" value={affiliateCount + providerCount} description={`Affiliate marketing: ${affiliateCount} • Provider cung ứng: ${providerCount}`} icon={BadgePercent} />
      </AdminOverviewGrid>

      <div className="grid gap-4 md:grid-cols-4">
        <AdminLinkButton href={ROUTES.ADMIN.CUSTOMERS}>Mở danh sách khách hàng</AdminLinkButton>
        <AdminLinkButton href={ROUTES.ADMIN.AFFILIATE_USERS}>Mở danh sách đối tác / CTV</AdminLinkButton>
        <AdminLinkButton href={ROUTES.ADMIN.PROVIDER_ACCOUNTS}>Mở danh sách nhà cung cấp</AdminLinkButton>
        <AdminCreateLinkButton href={ROUTES.ADMIN.USERS_CREATE}>Tạo người dùng</AdminCreateLinkButton>
      </div>

      <UserManagement initialUsers={users} actor={actor} />
    </section>
  );
}
