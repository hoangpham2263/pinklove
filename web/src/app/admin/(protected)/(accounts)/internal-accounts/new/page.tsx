import { InternalAccountEditorForm } from "@/features/admin/components/internal-accounts/internal-account-editor-form";
import { requireAdminPermission } from "@/lib/auth";

export default async function AdminInternalAccountCreatePage() {
  await requireAdminPermission("accounts.manage");

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Thêm tài khoản nội bộ</h1>
      </div>
      <InternalAccountEditorForm />
    </section>
  );
}
