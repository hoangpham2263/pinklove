import { ProviderAccountCreateForm } from "@/features/admin/components/provider-account-management/provider-account-create-form";
import { requireAdminPermission } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

type AdminProviderAccountsCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminProviderAccountsCreatePage({ searchParams }: AdminProviderAccountsCreatePageProps) {
  await requireAdminPermission("accounts.manage");
  const query = (await searchParams) ?? {};
  const returnTo = getQueryValue(query.returnTo) ?? ROUTES.ADMIN.PROVIDER_ACCOUNTS;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Tạo xưởng in / nhà cung cấp</h1>
      </div>
      <ProviderAccountCreateForm returnTo={returnTo} />
    </section>
  );
}
