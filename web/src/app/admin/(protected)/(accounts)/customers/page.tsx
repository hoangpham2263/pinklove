import { requireAdmin, listAccounts, listAccountsByRole } from "@/lib/auth";
import { USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";
import { RoleAccountManagementPage } from "@/features/admin/components/users/role-account-management-page";

type AdminCustomersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminCustomersPage({ searchParams }: AdminCustomersPageProps) {
  const actor = await requireAdmin();
  await searchParams;
  const [users, allUsers] = await Promise.all([
    listAccountsByRole(USER_ROLES.CUSTOMER),
    listAccounts(),
  ]);

  return (
    <RoleAccountManagementPage
      role={USER_ROLES.CUSTOMER}
      actor={actor}
      users={users}
      totalAccounts={allUsers.length}
      title="Quản lý khách hàng"
      description="Theo dõi các tài khoản khách mua dịch vụ hoặc sử dụng hệ thống ở vai trò thành viên thông thường."
      createHref={ROUTES.ADMIN.CUSTOMERS_CREATE}
      listHref={ROUTES.ADMIN.CUSTOMERS}
      createLabel="Tạo khách hàng"
      showInlineCreateForm={false}
      useCreateDialog
    />
  );
}
