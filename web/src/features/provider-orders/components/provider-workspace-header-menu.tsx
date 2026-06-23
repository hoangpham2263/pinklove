"use client";

import { useState } from "react";
import { LogOut, Menu as MenuIcon } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProviderIconButton, ProviderNavSubmitButton } from "@/features/provider-orders/components/provider-buttons";
import { ProviderWorkspaceNavLink } from "@/features/provider-orders/components/provider-workspace-nav-link";
import {
  PROVIDER_NAV_AUXILIARY_ITEMS,
  getProviderNavItems,
  type ProviderNavEntry,
} from "@/features/provider-orders/config/navigation";
import { PROVIDER_NAV_ICON_MAP } from "@/features/provider-orders/config/navigation-icons";
import { ROUTES } from "@/lib/routes";

function StandaloneItem({
  item,
  onNavigate,
}: {
  item: ProviderNavEntry;
  onNavigate: () => void;
}) {
  const Icon = PROVIDER_NAV_ICON_MAP[item.iconName];

  return (
    <ProviderWorkspaceNavLink
      href={item.href}
      exact={item.type === "link" ? item.exact : undefined}
      matchPrefixes={item.matchPrefixes}
      excludePaths={item.excludePaths}
      excludePrefixes={item.excludePrefixes}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
      activeClassName="bg-muted"
      inactiveClassName="hover:bg-muted"
      onNavigate={onNavigate}
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </ProviderWorkspaceNavLink>
  );
}

export function ProviderWorkspaceHeaderMenu() {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);
  const navItems = getProviderNavItems();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <ProviderIconButton
        type="button"
        className="rounded-full md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <MenuIcon className="h-4 w-4" />
      </ProviderIconButton>

      <SheetContent side="left" className="w-[min(22rem,calc(100vw-2rem))] rounded-r-2xl p-0 md:hidden">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="text-base">Menu</SheetTitle>
        </SheetHeader>

        <div className="admin-sidebar-scroll flex max-h-[calc(100vh-5rem)] flex-col gap-2 overflow-y-auto px-3 py-3">
          {navItems.map((item) => (
            <StandaloneItem key={item.key} item={item} onNavigate={closeMenu} />
          ))}

          <div className="my-1 border-t" />

          {PROVIDER_NAV_AUXILIARY_ITEMS.map((item) => (
            <StandaloneItem key={item.href} item={item} onNavigate={closeMenu} />
          ))}

          <NativeForm action={ROUTES.AUTH.LOGOUT_API} method="POST">
            <ProviderNavSubmitButton>
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất</span>
            </ProviderNavSubmitButton>
          </NativeForm>
        </div>
      </SheetContent>
    </Sheet>
  );
}
