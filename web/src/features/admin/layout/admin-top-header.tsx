"use client";

import { RouteBreadcrumbs } from "@/components/common/route-breadcrumbs";
import { AdminHeaderMenu } from "@/features/admin/layout/admin-header-menu";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { ROUTES } from "@/lib/routes";

type AdminTopHeaderProps = {
  username: string;
  breadcrumbEnabled?: boolean;
  breadcrumbSeparator?: string;
};

export function AdminTopHeader({
  username,
  breadcrumbEnabled = true,
  breadcrumbSeparator,
}: AdminTopHeaderProps) {
  return (
    <header
      id="admin-top-header"
      data-slot="admin-top-header"
      className="admin-top-header fixed left-0 right-0 top-0 z-50 h-14 border-b border-border bg-background md:left-[18.181818%]"
    >
      <div className="flex h-full w-full items-center justify-between px-5 md:px-7.5">
        <div className="flex min-w-0 items-center gap-3">
          {breadcrumbEnabled ? (
            <>
              <span className="shrink-0 text-foreground">|</span>
              <RouteBreadcrumbs
                separator={breadcrumbSeparator}
                listClassName="flex-nowrap overflow-hidden whitespace-nowrap text-sm"
                linkClassName="truncate"
                currentClassName="truncate font-medium text-foreground"
              />
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell listHref={ROUTES.ADMIN.NOTIFICATIONS} />
          <span>{username}</span>
          <AdminHeaderMenu />
        </div>
      </div>
    </header>
  );
}
