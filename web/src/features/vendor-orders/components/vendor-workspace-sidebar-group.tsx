"use client";

import {
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
  MapPin,
  PackageCheck,
  PackagePlus,
  PackageSearch,
  Settings,
  ShoppingBag,
  User as UserIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { VendorWorkspaceNavLink } from "@/features/vendor-orders/components/vendor-workspace-nav-link";
import type { VendorNavChild, VendorNavIconName } from "@/features/vendor-orders/config/navigation";

type VendorWorkspaceSidebarGroupProps = {
  label: string;
  iconName: VendorNavIconName;
  items: VendorNavChild[];
  defaultOpen?: boolean;
};

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  "map-pin": MapPin,
  "package-check": PackageCheck,
  "package-plus": PackagePlus,
  "package-search": PackageSearch,
  settings: Settings,
  "shopping-bag": ShoppingBag,
  user: UserIcon,
  "external-link": ExternalLink,
} satisfies Record<VendorNavIconName, React.ComponentType<{ className?: string }>>;

function isActivePath(pathname: string, item: VendorNavChild) {
  if (item.matchPrefixes?.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  if (item.exact) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function VendorWorkspaceSidebarGroup({
  label,
  iconName,
  items,
  defaultOpen = false,
}: VendorWorkspaceSidebarGroupProps) {
  const pathname = usePathname();
  const GroupIcon = iconMap[iconName];
  const hasActiveItem = items.some((item) => isActivePath(pathname, item));

  return (
    <Collapsible defaultOpen={defaultOpen || hasActiveItem} className="group/collapsible">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-muted">
        <div className="flex items-center gap-3">
          <GroupIcon className="h-5 w-5" />
          <span>{label}</span>
        </div>
        <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-none data-[state=open]:animate-none data-[state=closed]:h-0 data-[state=open]:h-[var(--radix-collapsible-content-height)] data-[state=closed]:opacity-0 data-[state=open]:opacity-100 transition-[height,opacity] duration-200 ease-out">
        <div className="ml-5 mt-1 flex flex-col gap-1 border-l pl-2.5">
          {items.map((item) => {
            const ItemIcon = iconMap[item.iconName];

            return (
              <VendorWorkspaceNavLink
                key={item.href}
                href={item.href}
                exact={item.exact}
                matchPrefixes={item.matchPrefixes}
                className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors"
                activeClassName="bg-muted"
                inactiveClassName="hover:bg-muted"
              >
                <ItemIcon className="h-4 w-4" />
                <span>{item.label}</span>
              </VendorWorkspaceNavLink>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
