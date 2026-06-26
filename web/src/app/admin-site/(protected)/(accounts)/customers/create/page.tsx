import { UserCreateForm } from "@/features/admin/components/users/user-create-form";
import { listAdminRoles } from "@/features/access/server/service";
import { requireAdminPermission } from "@/lib/auth";
import { USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

type AdminCustomersCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminCustomersCreatePage({ searchParams }: AdminCustomersCreatePageProps) {
  await requireAdminPermission("accounts.manage");
  await searchParams;
  const adminRoles = await listAdminRoles();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Tạo khách hàng</h1>
      </div>
      <UserCreateForm
        defaultRole={USER_ROLES.CUSTOMER}
        returnTo={ROUTES.ADMIN.CUSTOMERS}
        adminRoles={adminRoles}
      />
    </section>
  );
}
