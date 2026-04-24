"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { BellRing, Store } from "lucide-react";

import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { ROUTES } from "@/lib/routes";

type VendorWorkspaceTopHeaderProps = {
  username: string;
  vendorName: string;
  portalHref: string;
};

function getPageTitle(pathname: string) {
  if (pathname.startsWith(ROUTES.PARTNER.PRODUCTS)) {
    return pathname === ROUTES.PARTNER.PRODUCT_NEW ? "Tạo hồ sơ sản phẩm" : "Sản phẩm vendor";
  }

  if (pathname.startsWith(ROUTES.PARTNER.ORDER("").slice(0, -1))) {
    return "Đơn được giao";
  }

  return "Vendor Workspace";
}

export function VendorWorkspaceTopHeader({
  username,
  vendorName,
  portalHref,
}: VendorWorkspaceTopHeaderProps) {
  const pathname = usePathname();
  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-14 border-b border-zinc-200 bg-[rgba(255,253,249,0.92)] backdrop-blur md:left-[16.666667%]">
      <div className="flex h-full items-center justify-between px-4 md:px-7.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-900 md:flex">
            <Store className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">{pageTitle}</p>
            <p className="truncate text-sm font-semibold text-zinc-950">{vendorName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1 text-xs text-zinc-600 lg:flex">
            <BellRing className="h-3.5 w-3.5 text-amber-700" />
            Quản lý riêng cho vendor
          </div>
          <NotificationBell listHref={portalHref} />
          <span className="hidden text-sm text-zinc-600 md:inline">{username}</span>
          <form action={ROUTES.AUTH.LOGOUT_API} method="POST">
            <button type="submit" className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-950">
              Đăng xuất
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
