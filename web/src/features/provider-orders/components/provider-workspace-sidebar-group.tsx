"use client";

import { useState } from "react";
import {
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
  MapPin,
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
import type { ProviderNavChild, ProviderNavIconName } from "@/features/provider-orders/config/navigation";

type ProviderWorkspaceSidebarGroupProps = {
  label: string;
  iconName: ProviderNavIconName;
  items: ProviderNavChild[];
  defaultOpen?: boolean;
};

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

export function ProviderWorkspaceSidebarGroup({
  label,
  iconName,
  items,
  defaultOpen = false,
}: ProviderWorkspaceSidebarGroupProps) {
  const pathname = usePathname();
  const GroupIcon = iconMap[iconName];
  const hasActiveItem = items.some((item) => isActivePath(pathname, item));
  const [open, setOpen] = useState(defaultOpen || hasActiveItem);

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <div className="flex items-center gap-3">
          <GroupIcon className="h-5 w-5" />
          <span>{label}</span>
        </div>
        <ChevronRight className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open ? (
        <div className="ml-5 mt-1 flex flex-col gap-1 border-l pl-2.5">
          {items.map((item) => (
            <ProviderWorkspaceNavLink
              key={item.href}
              href={item.href}
              exact={item.exact}
              matchPrefixes={item.matchPrefixes}
              className="flex items-center rounded-md px-3 py-2 transition-colors"
              activeClassName="bg-muted"
              inactiveClassName="hover:bg-muted"
            >
              <span>{item.label}</span>
            </ProviderWorkspaceNavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}
