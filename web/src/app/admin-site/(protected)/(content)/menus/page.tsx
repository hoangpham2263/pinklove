import { ListChecks, ListTree, Menu as MenuIcon } from "lucide-react";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
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
      <AdminOverviewGrid className="md:grid-cols-3 lg:grid-cols-3">
        <AdminOverviewCard title="Tổng menu" value={totalMenus} icon={MenuIcon} />
        <AdminOverviewCard title="Tổng mục điều hướng" value={totalItems} icon={ListTree} />
        <AdminOverviewCard title="Menu trống" value={emptyMenus} icon={ListChecks} />
      </AdminOverviewGrid>

      <AdminMenusTable menus={menus} />
    </section>
  );
}
