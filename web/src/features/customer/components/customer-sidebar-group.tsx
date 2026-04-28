"use client";

import {
  BadgePercent,
  ChevronRight,
  FolderHeart,
  MapPin,
  MessageCircle,
  Settings,
  ShoppingBag,
  User as UserIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CustomerNavLink } from "@/features/customer/components/customer-nav-link";
import { isRouteActive } from "@/lib/navigation";

type CustomerSidebarIconName = "map-pin" | "folder-heart" | "shopping-bag" | "message-circle" | "user" | "badge-percent" | "settings";

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
  "map-pin": MapPin,
  "folder-heart": FolderHeart,
  "shopping-bag": ShoppingBag,
  "message-circle": MessageCircle,
  user: UserIcon,
  "badge-percent": BadgePercent,
  settings: Settings,
} satisfies Record<CustomerSidebarIconName, React.ComponentType<{ className?: string }>>;

export function CustomerSidebarGroup({
  label,
  iconName,
  items,
  defaultOpen = false,
}: CustomerSidebarGroupProps) {
  const pathname = usePathname();
  const GroupIcon = iconMap[iconName];
  const hasActiveItem = items.some((item) => isRouteActive(pathname, item.href, true));

  return (
    <Collapsible defaultOpen={defaultOpen || hasActiveItem} className="group/collapsible">
      <CollapsibleTrigger
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-muted"
      >
        <div className="flex items-center gap-3">
          <GroupIcon className="h-5 w-5" />
          <span>{label}</span>
        </div>
        <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-none data-[state=open]:animate-none data-[state=closed]:h-0 data-[state=open]:h-[var(--radix-collapsible-content-height)] data-[state=closed]:opacity-0 data-[state=open]:opacity-100 transition-[height,opacity] duration-200 ease-out">
        <div className="ml-5 mt-1 flex flex-col gap-1 border-l pl-4">
          {items.map((item) => {
            const ItemIcon = iconMap[item.iconName];

            return (
              <CustomerNavLink
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted"
              >
                <ItemIcon className="h-4 w-4" />
                <span>{item.label}</span>
              </CustomerNavLink>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
