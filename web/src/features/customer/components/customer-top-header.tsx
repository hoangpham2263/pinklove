"use client";

import { RouteBreadcrumbs } from "@/components/common/route-breadcrumbs";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { ROUTES } from "@/lib/routes";

type CustomerTopHeaderProps = {
 username: string;
 breadcrumbEnabled?: boolean;
 breadcrumbSeparator?: string;
};

export function CustomerTopHeader({
 username,
 breadcrumbEnabled = true,
 breadcrumbSeparator,
}: CustomerTopHeaderProps) {
 return (
 <header
  id="customer-top-header"
  data-slot="customer-top-header"
  className="fixed left-0 right-0 top-0 z-50 h-14 border-b border-border bg-background md:left-[16.666667%]"
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
   <NotificationBell />
   <span>{username}</span>
   <form action={ROUTES.AUTH.LOGOUT_API} method="POST">
   <button type="submit" className="hover:underline">
    Logout
   </button>
   </form>
  </div>
  </div>
 </header>
 );
}
