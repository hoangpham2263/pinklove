import { notFound } from "next/navigation";

import { AdminBackButton } from "@/features/admin/components/admin-buttons";
import { MenuEditor } from "@/features/admin/components/menus/menu-editor";
import { requireAdmin } from "@/lib/auth";
import { listManagedPages } from "@/lib/managed-pages";
import { getMenuByName } from "@/lib/menu";
import { ROUTES } from "@/lib/routes";

type AdminMenuEditProps = {
  params: Promise<{ name: string }>;
};

export default async function AdminMenuEdit({ params }: AdminMenuEditProps) {
  await requireAdmin();

  const { name } = await params;
  const menu = await getMenuByName(decodeURIComponent(name));

  if (!menu) {
    return notFound();
  }

  const pages = await listManagedPages();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex items-center gap-4">
        <AdminBackButton href={ROUTES.ADMIN.MENUS} destinationLabel="Menus" />
      </div>

      <MenuEditor menu={menu} availablePages={pages} />
    </section>
  );
}
