import { AdminRoleEditorForm } from "@/features/access/admin/admin-role-editor-form";
import { listAdminPermissions } from "@/features/access/server/service";
import { requireAdminPermission } from "@/lib/auth";

export default async function AdminAccessRoleCreatePage() {
  await requireAdminPermission("accounts.manage");
  const permissions = await listAdminPermissions();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Tạo vai trò</h1>
      </div>
      <AdminRoleEditorForm permissions={permissions} />
    </section>
  );
}
