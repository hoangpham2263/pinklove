"use client";

import { useMemo } from"react";
import { usePathname } from"next/navigation";
import { ROUTES } from "@/lib/routes";

type CustomerTopHeaderProps = {
 username: string;
};

function getPageTitle(pathname: string): string {
 if (pathname === ROUTES.CUSTOMER.ROOT || pathname.startsWith(ROUTES.CUSTOMER.DASHBOARD)) return "Dashboard";
 if (pathname.startsWith(ROUTES.CUSTOMER.INVITATIONS)) return "My Invitations";
 if (pathname.startsWith(ROUTES.CUSTOMER.PROFILE)) return "Profile";
 if (pathname.startsWith(ROUTES.CUSTOMER.AFFILIATE)) return "Affiliate";
 if (pathname.startsWith(ROUTES.CUSTOMER.VENDOR)) return "Vendor";
 if (pathname.startsWith(ROUTES.CUSTOMER.SETTINGS)) return "Settings";
 return "Customer";
}

export function CustomerTopHeader({ username }: CustomerTopHeaderProps) {
 const pathname = usePathname();
 const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);

 return (
 <header
  id="customer-top-header"
  data-slot="customer-top-header"
  className="sticky top-0 z-50 h-14 w-full border-b border-border bg-background text-foreground"
 >
  <div className="flex h-full w-full items-center justify-between px-5 md:px-7.5">
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
