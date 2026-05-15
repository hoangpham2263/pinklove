import { AdminHooksCatalog, adminHookCatalogSeed } from "@/features/admin/components/hooks/admin-hooks-catalog";
import { requireAdmin } from "@/lib/auth";

export default async function AdminHooksPage() {
  await requireAdmin();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hooks</h1>
            <p className="text-muted-foreground">
              Quản lý toàn bộ hook point hiện có của website để làm lớp đồng bộ ra hệ thống ngoài.
            </p>
          </div>
        </div>
      </div>

      <AdminHooksCatalog hooks={adminHookCatalogSeed} />
    </section>
  );
}
