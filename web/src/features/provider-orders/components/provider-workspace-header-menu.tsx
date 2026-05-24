"use client";

import { useState } from "react";
import {
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu as MenuIcon,
  MessagesSquare,
  PackageCheck,
  PackagePlus,
  PackageSearch,
  Settings,
  ShoppingBag,
  User as UserIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { ProviderWorkspaceNavLink } from "@/features/provider-orders/components/provider-workspace-nav-link";
import {
  PROVIDER_NAV_AUXILIARY_ITEMS,
  PROVIDER_NAV_GROUPS,
  PROVIDER_NAV_PRIMARY_ITEMS,
  PROVIDER_NAV_SECONDARY_ITEMS,
  type ProviderNavChild,
  type ProviderNavGroupEntry,
  type ProviderNavIconName,
  type ProviderNavLinkEntry,
} from "@/features/provider-orders/config/navigation";
import { ROUTES } from "@/lib/routes";

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  "messages-square": MessagesSquare,
  "map-pin": MapPin,
  "package-check": PackageCheck,
  "package-plus": PackagePlus,
  "package-search": PackageSearch,
  settings: Settings,
  "shopping-bag": ShoppingBag,
  user: UserIcon,
  "external-link": ExternalLink,
} satisfies Record<ProviderNavIconName, React.ComponentType<{ className?: string }>>;

function isActivePath(pathname: string, item: ProviderNavChild) {
  if (item.matchPrefixes?.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  if (item.exact) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function StandaloneItem({
  item,
  onNavigate,
}: {
  item: ProviderNavLinkEntry;
  onNavigate: () => void;
}) {
  const Icon = iconMap[item.iconName];

  return (
    <ProviderWorkspaceNavLink
      href={item.href}
      exact={item.exact}
      matchPrefixes={item.matchPrefixes}
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

function MenuChildItem({
  item,
  onNavigate,
}: {
  item: ProviderNavChild;
  onNavigate: () => void;
}) {
  return (
    <ProviderWorkspaceNavLink
      href={item.href}
      exact={item.exact}
      matchPrefixes={item.matchPrefixes}
      className="flex items-center rounded-lg px-3 py-2.5 transition-colors"
      activeClassName="bg-muted"
      inactiveClassName="hover:bg-muted"
      onNavigate={onNavigate}
    >
      <span>{item.label}</span>
    </ProviderWorkspaceNavLink>
  );
}

function MenuGroup({
  group,
  onNavigate,
}: {
  group: ProviderNavGroupEntry;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const GroupIcon = iconMap[group.iconName];
  const hasActiveItem = group.children.some((item) => isActivePath(pathname, item));
  const [open, setOpen] = useState(group.defaultOpen || hasActiveItem);

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <div className="flex items-center gap-3">
          <GroupIcon className="h-4 w-4" />
          <span>{group.label}</span>
        </div>
        <ChevronRight className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open ? (
        <div className="ml-5 mt-1 flex flex-col gap-1 border-l pl-2.5">
          {group.children.map((item) => (
            <MenuChildItem key={item.href} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ProviderWorkspaceHeaderMenu() {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-muted md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <MenuIcon className="h-4 w-4" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Đóng menu"
            onClick={closeMenu}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(22rem,calc(100vw-2rem))] flex-col rounded-r-2xl border-r bg-background shadow-xl">
            <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
              <p className="text-base font-semibold">Menu</p>
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-full transition-colors hover:bg-muted"
                aria-label="Đóng menu"
                onClick={closeMenu}
              >
                <span aria-hidden="true" className="text-xl leading-none">×</span>
              </button>
            </div>

            <div className="admin-sidebar-scroll min-h-0 flex-1 overflow-y-auto px-3 py-3">
              <div className="flex flex-col gap-2">
                {PROVIDER_NAV_PRIMARY_ITEMS.map((item) => (
                  <StandaloneItem key={item.href} item={item} onNavigate={closeMenu} />
                ))}

                <div className="my-1 border-t" />

                {PROVIDER_NAV_GROUPS.map((entry) => (
                  <MenuGroup key={entry.label} group={entry} onNavigate={closeMenu} />
                ))}

                <div className="my-1 border-t" />

                {PROVIDER_NAV_SECONDARY_ITEMS.map((item) => (
                  <StandaloneItem key={item.href} item={item} onNavigate={closeMenu} />
                ))}

                <div className="my-1 border-t" />

                {PROVIDER_NAV_AUXILIARY_ITEMS.map((item) => (
                  <StandaloneItem key={item.href} item={item} onNavigate={closeMenu} />
                ))}

                <div className="my-1 border-t" />

                <form action={ROUTES.AUTH.LOGOUT_API} method="POST">
                  <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted">
                    <LogOut className="h-4 w-4" />
                    <span>Đăng xuất</span>
                  </button>
                </form>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
