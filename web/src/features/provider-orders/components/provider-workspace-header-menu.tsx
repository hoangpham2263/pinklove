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

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { isRouteActive } from "@/lib/navigation";
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
  return isRouteActive(pathname, item.href, {
    exact: item.exact,
    matchPrefixes: item.matchPrefixes,
    excludePaths: item.excludePaths,
    excludePrefixes: item.excludePrefixes,
  });
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
      excludePaths={item.excludePaths}
      excludePrefixes={item.excludePrefixes}
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
  const activeItemKey = group.children.find((item) => isActivePath(pathname, item))?.href ?? "inactive";

  return (
    <Collapsible key={activeItemKey} defaultOpen={group.defaultOpen || hasActiveItem} className="group/collapsible">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted data-[state=open]:bg-muted">
        <div className="flex items-center gap-3">
          <GroupIcon className="h-4 w-4" />
          <span>{group.label}</span>
        </div>
        <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-none data-[state=open]:animate-none data-[state=closed]:h-0 data-[state=open]:h-[var(--radix-collapsible-content-height)] data-[state=closed]:opacity-0 data-[state=open]:opacity-100 transition-[height,opacity] duration-200 ease-out">
        <div className="ml-5 mt-1 flex flex-col gap-1 border-l pl-2.5">
          {group.children.map((item) => (
            <MenuChildItem key={item.href} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ProviderWorkspaceHeaderMenu() {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="rounded-full md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <MenuIcon className="h-4 w-4" />
      </Button>

      <SheetContent side="left" className="w-[min(22rem,calc(100vw-2rem))] rounded-r-2xl p-0 md:hidden">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="text-base">Menu</SheetTitle>
        </SheetHeader>

        <div className="admin-sidebar-scroll flex max-h-[calc(100vh-5rem)] flex-col gap-2 overflow-y-auto px-3 py-3">
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

          <form action={ROUTES.AUTH.LOGOUT_API} method="POST">
            <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted">
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất</span>
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
