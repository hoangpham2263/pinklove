import { AdminRolesManager } from "@/features/access/admin/admin-roles-manager";
import { listAdminPermissions, listAdminRoles } from "@/features/access/server/service";
import { requireAdminPermission } from "@/lib/auth";

export default async function AdminAccessRolesPage() {
  await requireAdminPermission("accounts.manage");
  const [roles, permissions] = await Promise.all([listAdminRoles(), listAdminPermissions()]);
  return <section className="flex flex-col gap-5 p-5 md:p-7.5"><AdminRolesManager roles={roles} permissions={permissions} /></section>;
}
