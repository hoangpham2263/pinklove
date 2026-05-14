import { ListChecks, ListTree, Menu as MenuIcon } from "lucide-react";
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Tổng menu</CardTitle>
            <MenuIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{totalMenus}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Tổng mục điều hướng</CardTitle>
            <ListTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{totalItems}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Menu trống</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{emptyMenus}</p>
          </CardContent>
        </Card>
      </div>

      <AdminMenusTable menus={menus} />
    </section>
  );
}
