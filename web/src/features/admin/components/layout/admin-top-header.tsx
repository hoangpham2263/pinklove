"use client";

import { useMemo } from"react";
import { usePathname } from"next/navigation";
import { ROUTES } from "@/lib/routes";

type AdminTopHeaderProps = {
 username: string;
};

function getPageTitle(pathname: string): string {
 if (pathname === ROUTES.ADMIN.ROOT || pathname.startsWith(ROUTES.ADMIN.DASHBOARD)) return "Dashboard";
 if (pathname.startsWith(ROUTES.ADMIN.PAGES)) return "Pages";
 if (pathname.startsWith(ROUTES.ADMIN.BLOG_POSTS)) return "Blog Posts";
 if (pathname.startsWith(ROUTES.ADMIN.BLOG_CATEGORIES)) return "Blog Categories";
 if (pathname.startsWith(ROUTES.ADMIN.MENUS)) return "Navigation";
 if (pathname.startsWith(ROUTES.ADMIN.PRODUCT_LIST)) return "Product List";
 if (pathname.startsWith(ROUTES.ADMIN.PRODUCT_CATEGORIES)) return "Product Categories";
 if (pathname === ROUTES.ADMIN.PRODUCTS) return "Create Product";
 if (pathname.startsWith(ROUTES.ADMIN.PRODUCTS)) return "Products";
 if (pathname.startsWith(ROUTES.ADMIN.USERS)) return "Users";
 if (pathname.startsWith(ROUTES.ADMIN.AFFILIATES)) return "Affiliate";
 if (pathname.startsWith(ROUTES.ADMIN.MEDIA)) return "Media";
 if (pathname.startsWith(ROUTES.ADMIN.SEO_PAGES)) return "Page SEO";
 if (pathname.startsWith(ROUTES.ADMIN.SEO_SCHEMA)) return "SEO Schema";
 if (pathname.startsWith(ROUTES.ADMIN.SEO_RULES)) return "SEO Rules";
 if (pathname.startsWith(ROUTES.ADMIN.SEO_GUIDE)) return "Page SEO";
 if (pathname.startsWith(ROUTES.ADMIN.CONFIG_COMMERCE)) return "Commerce Connections";
 if (pathname.startsWith(ROUTES.ADMIN.CONFIG)) return "Cấu hình";
 return "Admin";
}

export function AdminTopHeader({ username }: AdminTopHeaderProps) {
 const pathname = usePathname();
 const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);

 return (
 <header
  id="admin-top-header"
  data-slot="admin-top-header"
  className="admin-top-header fixed top-0 right-0 left-0 z-50 h-14 border-b border-border bg-background text-foreground md:left-60"
 >
  <div className="flex h-full w-full items-center justify-between px-6 md:px-8">
  <div className="flex items-center gap-3">
   <span className="text-muted-foreground">|</span>
   <p className="font-medium">{pageTitle}</p>
  </div>
  <div className="flex items-center gap-3">
   <span className="text-muted-foreground">{username}</span>
   <form action={ROUTES.AUTH.LOGOUT_API} method="POST">
   <button type="submit" className="text-foreground hover:underline">
    Logout
   </button>
   </form>
  </div>
  </div>
 </header>
 );
}
