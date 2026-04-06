import Link from"next/link";
import { LayoutDashboard, 
 User as UserIcon, 
 BadgePercent,
 Settings, 
 ExternalLink } from"lucide-react";

import { UserTopHeader } from"@/features/user/components/user-top-header";
import { requireAppUser } from"@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function UserLayout({ children, }: Readonly<{ children:React.ReactNode }>) { const user = await requireAppUser(ROUTES.AUTH.LOGIN);

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
 <p className="px-3 uppercase tracking-widest mb-2">Tài khoản</p>
 <Link href={ROUTES.USER.DASHBOARD} className={navItemClasses }>
 <LayoutDashboard className="h-5 w-5" />
 Bảng điều khiển
 </Link>
 <Link href="/user/profile" className={navItemClasses }>
 <UserIcon className="h-5 w-5" />
 Hồ sơ cá nhân
 </Link>
 <Link href={ROUTES.USER.AFFILIATE} className={navItemClasses }>
 <BadgePercent className="h-5 w-5" />
 Affiliate
 </Link>
 </div>

 <div className="space-y-1">
 <p className="px-3 uppercase tracking-widest mb-2">Cấu hình</p>
 <Link href="/user/settings" className={navItemClasses }>
 <Settings className="h-5 w-5" />
 Cài đặt tài khoản
 </Link>
 </div>

 <div className="mt-auto pt-4 border-t">
 <Link href="/" className={navItemClasses }>
 <ExternalLink className="h-5 w-5" />
 Xem Website
 </Link>
 </div>
 </nav>
 </aside>

 <main className="md:ml-64 min-h-screen bg-muted/30">
 <UserTopHeader username={user.username } />

 <section className="min-h-screen pt-14">
 <section className="md:hidden border-b bg-background px-4 py-2">
 <nav className="flex gap-4 overflow-x-auto py-1">
 <Link href={ROUTES.USER.DASHBOARD} className="flex items-center gap-1.5 whitespace-nowrap">
 <LayoutDashboard className="h-4 w-4" />
 Bảng điều khiển
 </Link>
 <Link href="/user/profile" className="flex items-center gap-1.5 whitespace-nowrap">
 <UserIcon className="h-4 w-4" />
 Hồ sơ
 </Link>
 <Link href={ROUTES.USER.AFFILIATE} className="flex items-center gap-1.5 whitespace-nowrap">
 <BadgePercent className="h-4 w-4" />
 Affiliate
 </Link>
 <Link href="/user/settings" className="flex items-center gap-1.5 whitespace-nowrap">
 <Settings className="h-4 w-4" />
 Cài đặt
 </Link>
 </nav>
 </section>
   <section className="min-h-screen">
   <div>{children }</div>
   </section>
 </section>
  </main>
 </div>
 ); }
