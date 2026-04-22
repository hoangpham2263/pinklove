"use client";

import {
  BadgePercent,
  Bell,
  Blocks,
  BookOpenText,
  CreditCard,
  ChevronRight,
  FileCode2,
  Files,
  Image as ImageIcon,
  Menu as MenuIcon,
  Package,
  Settings,
  ShoppingBag,
  Store,
  ReceiptText,
  Tags,
  Truck,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { AdminNavLink } from "@/features/admin/layout/admin-nav-link";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { isRouteActive } from "@/lib/navigation";

type AdminSidebarIconName =
  | "files"
  | "file-code-2"
  | "blocks"
  | "package"
  | "tags"
  | "receipt-text"
  | "credit-card"
  | "truck"
  | "shopping-bag"
  | "menu"
  | "image"
  | "book-open-text"
  | "bell"
  | "users"
  | "store"
  | "badge-percent"
  | "settings";

type AdminSidebarChild = {
  label: string;
  href: string;
  iconName: AdminSidebarIconName;
};

type AdminSidebarGroupProps = {
  label: string;
  iconName: AdminSidebarIconName;
  items: AdminSidebarChild[];
  defaultOpen?: boolean;
};

const iconMap = {
  files: Files,
  "file-code-2": FileCode2,
  blocks: Blocks,
  package: Package,
  tags: Tags,
  "receipt-text": ReceiptText,
  "credit-card": CreditCard,
  truck: Truck,
  "shopping-bag": ShoppingBag,
  menu: MenuIcon,
  image: ImageIcon,
  "book-open-text": BookOpenText,
  bell: Bell,
  users: Users,
  store: Store,
  "badge-percent": BadgePercent,
  settings: Settings,
} satisfies Record<AdminSidebarIconName, React.ComponentType<{ className?: string }>>;

export function AdminSidebarGroup({
  label,
  iconName,
  items,
  defaultOpen = true,
}: AdminSidebarGroupProps) {
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
              <AdminNavLink
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted"
              >
                <ItemIcon className="h-4 w-4" />
                <span>{item.label}</span>
              </AdminNavLink>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
