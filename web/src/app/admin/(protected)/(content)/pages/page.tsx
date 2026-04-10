import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPagesTable } from "@/features/admin/components/pages/admin-pages-table";
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Danh sách Trang</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tổng trang</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{pages.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{publishedCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{draftCount}</p>
          </CardContent>
        </Card>
      </div>

      <AdminPagesTable
        pages={pages}
        emptyMessage="Không có trang nào được đăng ký trong code."
      />
    </section>
  );
}
