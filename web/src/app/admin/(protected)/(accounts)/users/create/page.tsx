import { requireAdminPermission } from "@/lib/auth";
import { UserCreateForm } from "@/features/admin/components/users/user-create-form";
import { listAdminRoles } from "@/features/access/server/service";

type AdminUserCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUserCreatePage({ searchParams }: AdminUserCreatePageProps) {
  await requireAdminPermission("accounts.manage");
  await searchParams;
  const adminRoles = await listAdminRoles();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Tạo người dùng</h1>
      </div>

      <UserCreateForm adminRoles={adminRoles} />
    </section>
  );
}
