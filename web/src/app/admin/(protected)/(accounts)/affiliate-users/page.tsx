import { requireAdmin, listAccounts, listAccountsByRole } from "@/lib/auth";
import { USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";
import { RoleAccountManagementPage } from "@/features/admin/components/users/role-account-management-page";

type AdminAffiliateUsersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminAffiliateUsersPage({ searchParams }: AdminAffiliateUsersPageProps) {
  const actor = await requireAdmin();
  await searchParams;
  const [users, allUsers] = await Promise.all([
    listAccountsByRole(USER_ROLES.AFFILIATE),
    listAccounts(),
  ]);

  return (
    <RoleAccountManagementPage
      role={USER_ROLES.AFFILIATE}
      actor={actor}
      users={users}
      totalAccounts={allUsers.length}
      title="Quản lý đối tác / CTV"
      description="Nhóm actor này dùng cho tài khoản tiếp thị liên kết hoặc cộng tác viên. Đây là lớp quản lý account, khác với màn quản lý chương trình affiliate và hoa hồng."
      createHref={ROUTES.ADMIN.AFFILIATE_USERS_CREATE}
      listHref={ROUTES.ADMIN.AFFILIATE_USERS}
      createLabel="Tạo đối tác / CTV"
    />
  );
}
