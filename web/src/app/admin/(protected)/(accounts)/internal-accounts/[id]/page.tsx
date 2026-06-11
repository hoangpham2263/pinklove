import { notFound } from "next/navigation";

import { InternalAccountEditorForm } from "@/features/admin/components/internal-accounts/internal-account-editor-form";
import { requireAdminPermission } from "@/lib/auth";
import { getInternalAccount } from "@/lib/internal-accounts";

type AdminInternalAccountEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminInternalAccountEditPage({ params }: AdminInternalAccountEditPageProps) {
  await requireAdminPermission("accounts.manage");
  const { id } = await params;
  const account = await getInternalAccount(id);
  if (!account) notFound();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Chỉnh sửa tài khoản: {account.label}</h1>
      </div>
      <InternalAccountEditorForm account={account} />
    </section>
  );
}
