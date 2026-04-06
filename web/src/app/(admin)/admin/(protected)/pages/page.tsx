import { QuickCreatePageForm } from "@/features/admin/components/quick-create-page-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPagesTable } from "@/features/admin/components/admin-pages-table";
import { SYSTEM_PAGES, isSystemPageSlug } from "@/features/system-pages/registry";
import { requireAdmin } from "@/lib/auth";
import { listCmsPages } from "@/lib/cms";

type AdminPagesIndexProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminPagesIndex({ searchParams }: AdminPagesIndexProps) {
  await requireAdmin();
  const allPages = await listCmsPages();
  const query = (await searchParams) ?? {};

  const createdPages = allPages.filter((page) => !isSystemPageSlug(page.slug));
  
  const systemPagesList = Object.keys(SYSTEM_PAGES)
    .map((slug) => allPages.find((page) => page.slug === slug))
    .filter((page): page is NonNullable<typeof page> => page !== undefined);

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
              <CardTitle>Danh sách Trang đã tạo</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminPagesTable
                pages={createdPages}
                emptyMessage="Chưa có trang nào. Hãy tạo trang đầu tiên của bạn."
              />
            </CardContent>
          </Card>

          {/* System Pages Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-muted-foreground">Danh sách Trang hệ thống</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminPagesTable
                pages={systemPagesList}
                emptyMessage="Không có trang hệ thống nào được định nghĩa."
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-3">
          <div className="sticky top-20 space-y-6">
            <Card className="border">
              <CardHeader className="pb-3 bg-muted/30">
                <CardTitle className="font-bold">Tạo nhanh trang mới</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <QuickCreatePageForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
