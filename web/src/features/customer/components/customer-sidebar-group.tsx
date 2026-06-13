"use client";

import {
  BadgePercent,
  CalendarClock,
  ChevronRight,
  ExternalLink,
  FolderHeart,
  LayoutDashboard,
  Link as LinkIcon,
  MapPin,
  MessageCircle,
  Settings,
  ShoppingBag,
  Store,
  User as UserIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CustomerNavLink } from "@/features/customer/components/customer-nav-link";
import { isRouteActive } from "@/lib/navigation";

type CustomerSidebarIconName =
  | "layout-dashboard"
  | "map-pin"
  | "folder-heart"
  | "shopping-bag"
  | "calendar-clock"
  | "message-circle"
  | "user"
  | "badge-percent"
  | "link"
  | "settings"
  | "store"
  | "external-link";

type CustomerSidebarChild = {
  label: string;
  href: string;
  iconName: CustomerSidebarIconName;
};

type CustomerSidebarGroupProps = {
  label: string;
  iconName: CustomerSidebarIconName;
  items: CustomerSidebarChild[];
  defaultOpen?: boolean;
};

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  "map-pin": MapPin,
  "folder-heart": FolderHeart,
  "shopping-bag": ShoppingBag,
  "calendar-clock": CalendarClock,
  "message-circle": MessageCircle,
  user: UserIcon,
  "badge-percent": BadgePercent,
  link: LinkIcon,
  settings: Settings,
  store: Store,
  "external-link": ExternalLink,
} satisfies Record<CustomerSidebarIconName, React.ComponentType<{ className?: string }>>;

export function CustomerSidebarGroup({
  label,
  iconName,
  items,
  defaultOpen = false,
}: CustomerSidebarGroupProps) {
  const pathname = usePathname();
  const GroupIcon = iconMap[iconName];
  const hasActiveItem = items.some((item) => isRouteActive(pathname, item.href));
  const activeItemKey = items.find((item) => isRouteActive(pathname, item.href))?.href ?? "inactive";

  return (
    <Collapsible key={activeItemKey} defaultOpen={defaultOpen || hasActiveItem} className="group/collapsible">
      <CollapsibleTrigger
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-muted data-[state=open]:bg-muted"
      >
        <div className="flex min-w-0 items-center gap-3">
          <GroupIcon className="h-5 w-5 shrink-0" />
          <span className="truncate" title={label}>{label}</span>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-none data-[state=open]:animate-none data-[state=closed]:h-0 data-[state=open]:h-[var(--radix-collapsible-content-height)] data-[state=closed]:opacity-0 data-[state=open]:opacity-100 transition-[height,opacity] duration-200 ease-out">
        <div className="ml-5 mt-1 flex flex-col gap-1 border-l pl-2.5">
          {items.map((item) => (
            <CustomerNavLink
              key={item.href}
              href={item.href}
              className="flex min-w-0 items-center rounded-md px-3 py-2 transition-colors hover:bg-muted"
            >
              <span className="truncate" title={item.label}>{item.label}</span>
            </CustomerNavLink>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
