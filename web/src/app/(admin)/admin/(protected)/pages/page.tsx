import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageToast } from "@/components/common/page-toast";
import { AdminPagesTable } from "@/features/admin/components/pages/admin-pages-table";
import { requireAdmin } from "@/lib/auth";
import { listManagedCmsPages } from "@/lib/cms";

type AdminPagesIndexProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminPagesIndex({ searchParams }: AdminPagesIndexProps) {
  await requireAdmin();
  const pages = await listManagedCmsPages();
  const query = (await searchParams) ?? {};

  return (
    <section className="flex w-full flex-1 flex-col gap-8 p-4 md:p-8">
      {query.error ? <PageToast message={`Có lỗi xảy ra: ${String(query.error)}`} variant="error" /> : null}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Trang</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminPagesTable
            pages={pages}
            emptyMessage="Không có trang nào được đăng ký trong code."
          />
        </CardContent>
      </Card>
    </section>
  );
}
