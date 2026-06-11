import { InternalAccountsManager } from "@/features/admin/components/internal-accounts/internal-accounts-manager";
import { listInternalAccounts } from "@/lib/internal-accounts";
import { requireAdminPermission } from "@/lib/auth";

type AdminInternalAccountsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminInternalAccountsPage({
  searchParams,
}: AdminInternalAccountsPageProps) {
  await requireAdminPermission("accounts.view");
  await searchParams;

  const accounts = await listInternalAccounts();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <InternalAccountsManager accounts={accounts} />
    </section>
  );
}
