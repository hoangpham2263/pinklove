import { requireAdmin } from"@/lib/auth";
import { getMenuById } from"@/lib/menu";
import { listManagedPages } from"@/lib/managed-pages";
import { MenuEditor } from"@/features/admin/components/menus/menu-editor";
import Link from"next/link";
import { notFound } from"next/navigation";
import { ROUTES } from "@/lib/routes";

type AdminMenuEditProps = { params:Promise<{ id:string }>; };

export default async function AdminMenuEdit({ params }: AdminMenuEditProps) {
 await requireAdmin();
 const { id } = await params;
 const menu = await getMenuById(id);
 if (!menu) return notFound();

 const pages = await listManagedPages();
 return (
 <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
 <div className="flex items-center gap-4">
 <Link
 href={ROUTES.ADMIN.MENUS}
 className="inline-flex h-10 items-center justify-center rounded-lg border px-4"
 >
 Quay lại
 </Link>
 </div>

 <MenuEditor menu={menu } availablePages={pages } />
 </section>
 ); }
