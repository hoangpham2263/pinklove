"use client";

import { useMemo } from"react";
import { usePathname } from"next/navigation";
import { ROUTES } from "@/lib/routes";

type UserTopHeaderProps = {
 username: string;
};

function getPageTitle(pathname: string): string {
 if (pathname === "/user" || pathname.startsWith(ROUTES.USER.DASHBOARD)) return "Dashboard";
 if (pathname.startsWith(ROUTES.USER.SITES)) return "My Sites";
 if (pathname.startsWith(ROUTES.USER.PROFILE)) return "Profile";
 if (pathname.startsWith(ROUTES.USER.AFFILIATE)) return "Affiliate";
 if (pathname.startsWith(ROUTES.USER.SETTINGS)) return "Settings";
 return "User";
}

export function UserTopHeader({ username }: UserTopHeaderProps) {
 const pathname = usePathname();
 const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);

 return (
 <header
  id="user-top-header"
  data-slot="user-top-header"
  className="fixed top-0 right-0 left-0 z-50 h-14 border-b border-border bg-background text-foreground md:left-60"
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
