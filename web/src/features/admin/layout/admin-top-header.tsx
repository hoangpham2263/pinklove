"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

import { getAdminPageTitle } from "@/features/admin/config/route-meta";
import { ROUTES } from "@/lib/routes";

type AdminTopHeaderProps = {
  username: string;
};

export function AdminTopHeader({ username }: AdminTopHeaderProps) {
  const pathname = usePathname();
  const pageTitle = useMemo(() => getAdminPageTitle(pathname), [pathname]);

  return (
    <header
      id="admin-top-header"
      data-slot="admin-top-header"
      className="admin-top-header sticky top-0 z-50 h-14 w-full border-b border-border bg-background text-foreground"
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
