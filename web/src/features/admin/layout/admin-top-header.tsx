"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

import { AdminHeaderMenu } from "@/features/admin/layout/admin-header-menu";
import { getAdminPageTitle } from "@/features/admin/config/route-meta";

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
      className="admin-top-header fixed left-0 right-0 top-0 z-50 h-14 border-b border-border bg-background md:left-[16.666667%]"
    >
      <div className="flex h-full w-full items-center justify-between px-5 md:px-7.5">
        <div className="flex items-center gap-3">
          <span>|</span>
          <p className="font-medium">{pageTitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <span>{username}</span>
          <AdminHeaderMenu />
        </div>
      </div>
    </header>
  );
}
