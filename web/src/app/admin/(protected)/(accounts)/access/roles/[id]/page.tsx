import { notFound } from "next/navigation";

import { AdminRoleEditorForm } from "@/features/access/admin/admin-role-editor-form";
import { getAdminRole, listAdminPermissions } from "@/features/access/server/service";
import { requireAdminPermission } from "@/lib/auth";

type AdminAccessRoleEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminAccessRoleEditPage({ params }: AdminAccessRoleEditPageProps) {
  await requireAdminPermission("accounts.manage");
  const { id } = await params;
  const [role, permissions] = await Promise.all([getAdminRole(id), listAdminPermissions()]);

  if (!role || role.isSystem) {
    notFound();
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Chỉnh sửa vai trò: {role.label}</h1>
      </div>
      <AdminRoleEditorForm role={role} permissions={permissions} />
    </section>
  );
}
