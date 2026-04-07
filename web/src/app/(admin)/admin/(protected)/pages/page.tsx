import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      {query.error && (
        <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm border border-destructive/20">
          Có lỗi xảy ra: {query.error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-9 space-y-10">
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
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-3">
          <div className="sticky top-20 space-y-6">
            <Card className="border">
              <CardHeader className="pb-3 bg-muted/30">
                <CardTitle className="font-bold">Quản lý bằng code</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Trang mới không còn được tạo từ admin. Muốn thêm page mới, hãy tạo route/file mới trong code và đăng ký page đó vào registry nội dung.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
