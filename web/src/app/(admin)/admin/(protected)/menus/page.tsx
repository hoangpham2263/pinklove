import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminMenusTable } from "@/features/admin/components/admin-menus-table";
import { requireAdmin } from "@/lib/auth";
import { getMenus } from "@/lib/menu";

export default async function AdminMenusIndex() {
  await requireAdmin();
  const menus = await getMenus();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Danh sách Menu điều hướng</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminMenusTable menus={menus} />
        </CardContent>
      </Card>
    </section>
  );
}
