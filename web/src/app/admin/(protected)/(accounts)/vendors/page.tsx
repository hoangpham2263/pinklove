import { ensureVendorPortalSlug, requireAdmin, listAccounts, listAccountsByRole } from "@/lib/auth";
import { USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";
import { RoleAccountManagementPage } from "@/features/admin/components/users/role-account-management-page";

type AdminVendorsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminVendorsPage({ searchParams }: AdminVendorsPageProps) {
  const actor = await requireAdmin();
  await searchParams;
  const [users, allUsers] = await Promise.all([
    listAccountsByRole(USER_ROLES.VENDOR),
    listAccounts(),
  ]);
  const vendors = await Promise.all(
    users.map(async (vendor) => ({
      ...vendor,
      vendorPortalSlug: vendor.vendorPortalSlug || (await ensureVendorPortalSlug(vendor.id)) || "",
    }))
  );

  return (
    <RoleAccountManagementPage
      role={USER_ROLES.VENDOR}
      actor={actor}
      users={vendors}
      totalAccounts={allUsers.length}
      title="Quản lý xưởng in / nhà cung cấp"
      description="Nhóm actor này dành cho đối tác cung ứng sản phẩm hoặc dịch vụ. Có thể dùng để tách riêng nhà cung cấp khỏi khách hàng thông thường."
      createHref={ROUTES.ADMIN.VENDORS_CREATE}
      listHref={ROUTES.ADMIN.VENDORS}
      createLabel="Tạo nhà cung cấp"
      showInlineCreateForm={false}
      showVendorWorkspaceColumn
    />
  );
}
