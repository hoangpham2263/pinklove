"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, Menu } from "lucide-react";

import { AdminIconButton, AdminNavSubmitButton } from "@/features/admin/components/admin-buttons";
import {
  ADMIN_FEATURES,
  ADMIN_NAV_AUXILIARY_ITEMS,
  canAccessAdminFeature,
} from "@/features/admin/config/navigation";
import { ADMIN_NAV_ICON_MAP } from "@/features/admin/config/navigation-icons";
import { AdminNavLink } from "@/features/admin/layout/admin-nav-link";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ROUTES } from "@/lib/routes";

export function AdminHeaderMenu({ permissionKeys }: { permissionKeys?: string[] }) {
  const [open, setOpen] = useState(false);
  const visibleFeatures = ADMIN_FEATURES.filter((feature) => canAccessAdminFeature(feature, permissionKeys));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <AdminIconButton
        className="rounded-full md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </AdminIconButton>

      <SheetContent side="left" className="w-[min(22rem,calc(100vw-2rem))] rounded-r-2xl p-0 md:hidden">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="text-base">Menu</SheetTitle>
        </SheetHeader>

        <div className="flex max-h-[calc(100vh-5rem)] flex-col gap-1 overflow-y-auto px-3 py-3">
          {visibleFeatures.map((feature) => {
            const Icon = ADMIN_NAV_ICON_MAP[feature.iconName];
            return (
              <AdminNavLink
                key={feature.key}
                href={feature.href}
                exact={feature.exact}
                matchPrefixes={feature.matchPrefixes}
                excludePrefixes={feature.excludePrefixes}
                className="flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
                onClick={() => setOpen(false)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate" title={feature.label}>{feature.label}</span>
              </AdminNavLink>
            );
          })}

          <div className="my-1 border-t" />

          {ADMIN_NAV_AUXILIARY_ITEMS.map((entry) => {
            const Icon = ADMIN_NAV_ICON_MAP[entry.iconName];
            return (
              <Link
                key={entry.key}
                href={entry.href}
                className="flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate" title={entry.label}>{entry.label}</span>
              </Link>
            );
          })}

          <div className="my-1 border-t" />

          <form action={ROUTES.AUTH.LOGOUT_API} method="POST">
            <AdminNavSubmitButton>
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </AdminNavSubmitButton>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
