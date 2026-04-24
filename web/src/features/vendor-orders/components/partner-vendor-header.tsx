import Link from "next/link";
import { BellRing, LayoutGrid, LogOut, PackageSearch, PackagePlus, Store, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

type PartnerVendorHeaderProps = {
  vendorName: string;
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

export function PartnerVendorHeader({
  vendorName,
  portalHref,
  currentPath,
  currentOrderLabel,
}: PartnerVendorHeaderProps) {
  const navItems: NavItem[] = [
    {
      href: portalHref,
      label: "Tổng quan",
      icon: LayoutGrid,
      exact: true,
    },
    {
      href: ROUTES.PARTNER.LEGACY_ORDERS,
      label: "Đơn được giao",
      icon: PackageSearch,
      matchPrefixes: [ROUTES.PARTNER.LEGACY_ORDERS, ROUTES.PARTNER.ORDER("").slice(0, -1)],
    },
    {
      href: ROUTES.PARTNER.PRODUCTS,
      label: "Sản phẩm",
      icon: PackagePlus,
      matchPrefixes: [ROUTES.PARTNER.PRODUCTS],
    },
    {
      href: ROUTES.PARTNER.ACCOUNT,
      label: "Tài khoản",
      icon: UserRound,
      matchPrefixes: [ROUTES.PARTNER.ACCOUNT],
    },
  ];

  return (
    <div className="sticky top-0 z-40 border-b border-amber-100/80 bg-[rgba(255,253,249,0.86)] backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="h-20 flex items-center justify-between gap-5 lg:gap-7.5">
          <div className="w-full flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-10 flex shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-900"><Store className="size-5" /></div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wide text-amber-900/80">Vendor Workspace</p>
                <div className="flex items-center gap-2.5">
                  <p className="truncate text-sm lg:text-base font-semibold">{vendorName}</p>
                  {currentOrderLabel ? (
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium ring-1 ring-zinc-200">{currentOrderLabel}</span>
                  ) : null}
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
