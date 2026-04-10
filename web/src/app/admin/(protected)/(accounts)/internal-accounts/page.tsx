import { InternalAccountsManager } from "@/features/admin/components/internal-accounts/internal-accounts-manager";
import { listInternalAccounts } from "@/lib/internal-accounts";
import { requireAdmin } from "@/lib/auth";

type AdminInternalAccountsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminInternalAccountsPage({
  searchParams,
}: AdminInternalAccountsPageProps) {
  await requireAdmin();
  await searchParams;

  const accounts = await listInternalAccounts();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tài khoản nội bộ</h1>
        <p className="text-sm text-muted-foreground">
          Khu vực lưu tập trung các tài khoản PinkLove để tra cứu nhanh khi cần đăng nhập.
        </p>
      </div>

      <InternalAccountsManager accounts={accounts} />
    </section>
  );
}
