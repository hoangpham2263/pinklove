import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function ClientLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const dashboardHref = user?.role === "admin" ? ROUTES.ADMIN.DASHBOARD : ROUTES.USER.DASHBOARD;
  const settingsHref = user?.role === "admin" ? ROUTES.ADMIN.SETTINGS : ROUTES.USER.SETTINGS;

 return (
 <div className="flex min-h-full flex-1 flex-col">
  <header className="border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/60">
  <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-6">
   <Link href="/" className="font-semibold tracking-wide">
   Pinklove Client
   </Link>
   <nav className="flex items-center gap-4">
   <Link href="/" className="text-muted-foreground hover:text-foreground">
    Home
   </Link>
   <Link href="/about-us" className="text-muted-foreground hover:text-foreground">
    About Us
   </Link>
   <Link href="/contact" className="text-muted-foreground hover:text-foreground">
    Contact
   </Link>
   <details className="group relative">
    <summary className="list-none cursor-pointer text-muted-foreground hover:text-foreground">
    {user ? user.username :"Login"}
    </summary>
                    <div className="absolute right-0 top-8 z-50 min-w-48 rounded-lg border bg-background p-2">    {user ? (
     <div className="flex flex-col gap-1">
     <p className="px-2 py-1 text-muted-foreground">
      {user.username} ({user.role})
     </p>
     <Link href={dashboardHref} className="rounded-md px-2 py-1 hover:bg-muted">
      {user.role ==="admin" ?"Quản lý Admin" :"Trang người dùng"}
     </Link>
                       <Link href={settingsHref} className="rounded-md px-2 py-1 hover:bg-muted">
                         Cài đặt tài khoản
                       </Link>
                       <form action={ROUTES.AUTH.LOGOUT_API} method="POST">
                         <button
                           type="submit"      className="w-full rounded-md px-2 py-1 text-left text-destructive hover:bg-muted"
      >
      Đăng xuất
      </button>
     </form>
     </div>
    ) : (
     <div className="flex flex-col gap-1">
                       <Link href={ROUTES.AUTH.LOGIN} className="rounded-md px-2 py-1 hover:bg-muted">
                         Đăng nhập
                       </Link>
                       <Link href={ROUTES.AUTH.REGISTER} className="rounded-md px-2 py-1 hover:bg-muted">
                         Đăng ký
                       </Link>     </div>
    )}
    </div>
   </details>
   </nav>
  </div>
  </header>
  {children}
 </div>
 );
}
