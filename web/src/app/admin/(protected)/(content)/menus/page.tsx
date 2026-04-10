import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminMenusTable } from "@/features/admin/components/menus/admin-menus-table";
import { requireAdmin } from "@/lib/auth";
import { getMenus } from "@/lib/menu";

export default async function AdminMenusIndex() {
  await requireAdmin();
  const menus = await getMenus();
  const totalMenus = menus.length;
  const totalItems = menus.reduce((sum, menu) => sum + (menu.itemCount ?? 0), 0);
  const emptyMenus = menus.filter((menu) => (menu.itemCount ?? 0) === 0).length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Navigation</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tổng menu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{totalMenus}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tổng mục điều hướng</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{totalItems}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Menu trống</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{emptyMenus}</p>
          </CardContent>
        </Card>
      </div>

      <AdminMenusTable menus={menus} />
    </section>
  );
}
