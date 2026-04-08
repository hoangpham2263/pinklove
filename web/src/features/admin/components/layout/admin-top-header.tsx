"use client";

import { useMemo } from"react";
import { usePathname } from"next/navigation";
import { ROUTES } from "@/lib/routes";

type AdminTopHeaderProps = {
 username: string;
};

function getPageTitle(pathname: string): string {
 if (pathname === "/admin" || pathname.startsWith(ROUTES.ADMIN.DASHBOARD)) return "Dashboard";
 if (pathname.startsWith("/admin/pages")) return "Pages";
 if (pathname.startsWith("/admin/menus")) return "Navigation";
 if (pathname.startsWith(ROUTES.ADMIN.PRODUCT_LIST)) return "Product List";
 if (pathname.startsWith(ROUTES.ADMIN.PRODUCTS)) return "Products";
 if (pathname.startsWith("/admin/user")) return "Users";
 if (pathname.startsWith(ROUTES.ADMIN.AFFILIATES)) return "Affiliate";
 if (pathname.startsWith(ROUTES.ADMIN.MEDIA)) return "Media";
 if (pathname.startsWith(ROUTES.ADMIN.SEO_GUIDE)) return "Seo";
 if (pathname.startsWith(ROUTES.ADMIN.SETTINGS)) return "Settings";
 return "Admin";
}

export function AdminTopHeader({ username }: AdminTopHeaderProps) {
 const pathname = usePathname();
 const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);

 return (
 <header
  id="admin-top-header"
  data-slot="admin-top-header"
  className="admin-top-header fixed top-0 right-0 left-0 z-50 h-14 border-b border-border bg-background text-foreground md:left-64"
 >
  <div className="flex h-full w-full items-center justify-between px-6 md:px-8">
  <div className="flex items-center gap-3">
   <span className="text-muted-foreground">|</span>
   <p className="font-medium">{pageTitle}</p>
  </div>
  <div className="flex items-center gap-3">
   <span className="text-muted-foreground">{username}</span>
   <form action="/api/auth/logout" method="POST">
   <button type="submit" className="text-foreground hover:underline">
    Logout
   </button>
   </form>
  </div>
  </div>
 </header>
 );
}
