import Link from "next/link";
import { LayoutGrid, LogOut, PackageSearch, PackagePlus, Settings, Store } from "lucide-react";

import { RouteBreadcrumbs } from "@/components/common/route-breadcrumbs";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

type ProviderHeaderProps = {
  providerName: string;
  portalHref: string;
  currentPath?: string;
  currentOrderLabel?: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  exact?: boolean;
  matchPrefixes?: string[];
};

function isActivePath(currentPath: string | undefined, item: NavItem) {
  if (!currentPath) return false;
  if (item.exact) return currentPath === item.href;
  if (item.matchPrefixes?.some((prefix) => currentPath.startsWith(prefix))) {
    return true;
  }
  return currentPath === item.href || currentPath.startsWith(`${item.href}/`) || currentPath.startsWith(`${item.href}#`);
}

export function ProviderHeader({
  providerName,
  portalHref,
  currentPath,
  currentOrderLabel,
}: ProviderHeaderProps) {
  const navItems: NavItem[] = [
    {
      href: portalHref,
      label: "Tổng quan",
      icon: LayoutGrid,
      exact: true,
    },
    {
      href: ROUTES.PROVIDER.ORDERS,
      label: "Đơn được giao",
      icon: PackageSearch,
      matchPrefixes: [ROUTES.PROVIDER.ORDERS, ROUTES.PROVIDER.ORDER("").slice(0, -1)],
    },
    {
      href: ROUTES.PROVIDER.OFFERINGS,
      label: "Sản phẩm",
      icon: PackagePlus,
      matchPrefixes: [ROUTES.PROVIDER.OFFERINGS],
    },
    {
      href: ROUTES.PROVIDER.CONFIG_ACCOUNT,
      label: "Configs",
      icon: Settings,
      matchPrefixes: [ROUTES.PROVIDER.CONFIG],
    },
  ];

  return (
    <div className="sticky top-0 z-40 border-b border-amber-100/80 bg-[rgba(255,253,249,0.86)] backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="h-20 flex items-center justify-between gap-5 lg:gap-7.5">
          <div className="w-full flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-10 flex shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-900"><Store className="size-5" /></div>
              <div className="min-w-0 space-y-1">
                <p className="text-[10px] font-medium uppercase tracking-wide text-amber-900/80">Provider Workspace</p>
                <div className="flex items-center gap-2.5">
                  <p className="truncate text-sm lg:text-base font-semibold">{providerName}</p>
                  {currentOrderLabel ? (
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium ring-1 ring-zinc-200">{currentOrderLabel}</span>
                  ) : null}
                </div>
                <div className="flex min-w-0 items-center gap-2 text-sm">
                  <span className="shrink-0 text-zinc-950">|</span>
                  <RouteBreadcrumbs
                    listClassName="flex-nowrap overflow-hidden whitespace-nowrap text-xs text-zinc-500"
                    linkClassName="truncate hover:text-zinc-900"
                    currentClassName="truncate font-medium text-zinc-950"
                    separatorClassName="text-zinc-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(currentPath, item);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-zinc-950 text-white"
                        : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2.5 lg:gap-5">
              <NotificationBell listHref={portalHref} />
              <form action={ROUTES.AUTH.LOGOUT_API} method="POST">
                <Button type="submit" variant="outline" className="gap-2 rounded-full">Đăng xuất <LogOut className="size-5" /></Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
