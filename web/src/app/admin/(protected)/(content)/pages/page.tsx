import { CheckCircle2, Clock3, FileText } from "lucide-react";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { AdminPagesTable } from "@/features/pages/admin/admin-pages-table";
import { requireAdmin } from "@/lib/auth";
import { listManagedPages } from "@/lib/managed-pages";

type AdminPagesIndexProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminPagesIndex({ searchParams }: AdminPagesIndexProps) {
  await requireAdmin();
  const pages = await listManagedPages();
  await searchParams;
  const publishedCount = pages.filter((page) => page.status === "published").length;
  const draftCount = pages.length - publishedCount;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid className="md:grid-cols-3 lg:grid-cols-3">
        <AdminOverviewCard title="Tổng trang" value={pages.length} icon={FileText} />
        <AdminOverviewCard title="Published" value={publishedCount} icon={CheckCircle2} />
        <AdminOverviewCard title="Draft" value={draftCount} icon={Clock3} />
      </AdminOverviewGrid>

      <AdminPagesTable
        pages={pages}
        emptyMessage="Không có trang nào được đăng ký trong code."
      />
    </section>
  );
}
