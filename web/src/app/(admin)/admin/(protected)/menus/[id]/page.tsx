import { requireAdmin } from"@/lib/auth";
import { getMenuById } from"@/lib/menu";
import { listManagedCmsPages } from"@/lib/cms";
import { MenuEditor } from"@/features/admin/components/menus/menu-editor";
import Link from"next/link";
import { notFound } from"next/navigation";

type AdminMenuEditProps = { params:Promise<{ id:string }>;
 searchParams ?: Promise<Record<string, string | string[] | undefined>>; };

export default async function AdminMenuEdit({ params, searchParams }: AdminMenuEditProps) {

 await requireAdmin();
 const { id } = await params;
 const menuId = parseInt(id, 10);
 if (isNaN(menuId)) return notFound();

 const menu = await getMenuById(menuId);
 if (!menu) return notFound();

 const pages = await listManagedCmsPages();
 await searchParams;

 return (
 <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
 <div className="flex items-center gap-4">
 <Link
 href="/admin/menus"
 className="inline-flex h-10 items-center justify-center rounded-lg border px-4"
 >
 Quay lại
 </Link>
 </div>

 <MenuEditor menu={menu } availablePages={pages } />
 </section>
 ); }
