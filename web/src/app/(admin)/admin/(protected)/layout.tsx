import Link from"next/link";
import {
 LayoutDashboard,
 Files,
 Menu as MenuIcon,
 Image as ImageIcon,
 Users,
 Settings,
 ExternalLink
} from"lucide-react";

import { AdminTopHeader } from"@/features/admin/components/admin-top-header";

import { requireAdmin } from"@/lib/auth";
import { ROUTES } from "@/lib/routes";



export default async function AdminLayout({
 children
}: { children: React.ReactNode }) {
 const user = await requireAdmin();



 const navItemClasses ="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted";



 return (
 <div>
  <aside className="fixed top-0 left-0 hidden h-screen w-64 border-r bg-background p-5 md:flex md:flex-col md:gap-3">
  <div className="flex items-center gap-2 mb-6 px-3">
   <div className="h-6 w-6 rounded-bg bg-primary" />
   <h2 className="text-lg font-bold tracking-tight">PinkLove</h2>
  </div>

  <nav className="flex flex-col gap-6">

   <div className="space-y-1">

   <p className="px-3 uppercase tracking-widest mb-2">Tổng quan</p>

   <Link href={ROUTES.ADMIN.DASHBOARD} className={navItemClasses}>

    <LayoutDashboard className="h-5 w-5" />

    Bảng điều khiển

   </Link>

   </div>



   <div className="space-y-1">

   <p className="px-3 uppercase tracking-widest mb-2">Nội dung</p>

   <Link href="/admin/pages" className={navItemClasses}>

    <Files className="h-5 w-5" />

    Trang

   </Link>

   <Link href="/admin/menus" className={navItemClasses}>

    <MenuIcon className="h-5 w-5" />

    Menu điều hướng

   </Link>

   <Link href="/admin/media" className={navItemClasses}>

    <ImageIcon className="h-5 w-5" />

    Thư viện Ảnh

   </Link>

   </div>



   <div className="space-y-1">

   <p className="px-3 uppercase tracking-widest mb-2">Hệ thống</p>

   <Link href="/admin/user" className={navItemClasses}>

    <Users className="h-5 w-5" />

    Thành viên

   </Link>

   <Link href="/admin/settings" className={navItemClasses}>

    <Settings className="h-5 w-5" />

    Cài đặt chung

   </Link>

   </div>



   <div className="mt-auto pt-4 border-t">

   <Link href="/" className={navItemClasses}>

    <ExternalLink className="h-5 w-5" />

    Xem Website

   </Link>

   </div>

  </nav>

  </aside>



    <main className="md:ml-64 min-h-screen bg-muted/30">



    <AdminTopHeader username={user.username} />



  <section className="min-h-screen pt-14">

   <section className="md:hidden border-b bg-background px-4 py-2">

   <nav className="flex gap-4 overflow-x-auto py-1">

    <Link href={ROUTES.ADMIN.DASHBOARD} className="flex items-center gap-1.5 whitespace-nowrap">

    <LayoutDashboard className="h-4 w-4" />

    Bảng điều khiển

    </Link>



    <div className="w-px shrink-0 bg-border my-1" />



    <Link href="/admin/pages" className="flex items-center gap-1.5 whitespace-nowrap">

    <Files className="h-4 w-4" />

    Các trang

    </Link>

    <Link href="/admin/menus" className="flex items-center gap-1.5 whitespace-nowrap">

    <MenuIcon className="h-4 w-4" />

    Menu điều hướng

    </Link>

    <Link href="/admin/media" className="flex items-center gap-1.5 whitespace-nowrap">

    <ImageIcon className="h-4 w-4" />

    Thư viện Ảnh

    </Link>



    <div className="w-px shrink-0 bg-border my-1" />



    <Link href="/admin/user" className="flex items-center gap-1.5 whitespace-nowrap">

    <Users className="h-4 w-4" />

    Thành viên

    </Link>

    <Link href="/admin/settings" className="flex items-center gap-1.5 whitespace-nowrap">

    <Settings className="h-4 w-4" />

    Cài đặt

    </Link>

   </nav>

   </section>
   <section className="min-h-screen">
   <div>{children}</div>
   </section>
  </section>
  </main>
 </div>
 );
}
