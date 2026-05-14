import { CheckCircle2, Clock3, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Tổng trang</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{pages.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{publishedCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{draftCount}</p>
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
