"use client";

import {
  BadgePercent,
  Bell,
  Blocks,
  BookOpenText,
  Boxes,
  BriefcaseBusiness,
  CalendarClock,
  ChartNoAxesCombined,
  CreditCard,
  ChevronRight,
  FileCode2,
  Files,
  Image as ImageIcon,
  ListTree,
  Menu as MenuIcon,
  MessageCircle,
  MessagesSquare,
  Package,
  Radio,
  Search,
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
  | "boxes"
  | "briefcase-business"
  | "calendar-clock"
  | "chart-no-axes-combined"
  | "package"
  | "radio"
  | "search"
  | "tags"
  | "receipt-text"
  | "credit-card"
  | "truck"
  | "shopping-bag"
  | "menu"
  | "message-circle"
  | "messages-square"
  | "image"
  | "book-open-text"
  | "list-tree"
  | "bell"
  | "users"
  | "store"
  | "badge-percent"
  | "settings";

type AdminSidebarChild = {
  label: string;
  href: string;
  iconName: AdminSidebarIconName;
  exact?: boolean;
  matchPrefixes?: string[];
  excludePaths?: string[];
  excludePrefixes?: string[];
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
  boxes: Boxes,
  "briefcase-business": BriefcaseBusiness,
  "calendar-clock": CalendarClock,
  "chart-no-axes-combined": ChartNoAxesCombined,
  package: Package,
  radio: Radio,
  search: Search,
  tags: Tags,
  "receipt-text": ReceiptText,
  "credit-card": CreditCard,
  truck: Truck,
  "shopping-bag": ShoppingBag,
  menu: MenuIcon,
  "message-circle": MessageCircle,
  "messages-square": MessagesSquare,
  image: ImageIcon,
  "book-open-text": BookOpenText,
  "list-tree": ListTree,
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
  const hasActiveItem = items.some((item) =>
    isRouteActive(pathname, item.href, {
      exact: item.exact,
      matchPrefixes: item.matchPrefixes,
      excludePaths: item.excludePaths,
      excludePrefixes: item.excludePrefixes,
    }),
  );
  const activeItemKey =
    items.find((item) =>
      isRouteActive(pathname, item.href, {
        exact: item.exact,
        matchPrefixes: item.matchPrefixes,
        excludePaths: item.excludePaths,
        excludePrefixes: item.excludePrefixes,
      }),
    )?.href ?? "inactive";

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
          {items.map((item, index) => (
            <AdminNavLink
              key={`${item.href}:${item.label}:${index}`}
              href={item.href}
              exact={item.exact}
              matchPrefixes={item.matchPrefixes}
              excludePaths={item.excludePaths}
              excludePrefixes={item.excludePrefixes}
              className="flex min-w-0 items-center rounded-md px-3 py-2 transition-colors hover:bg-muted"
            >
              <span className="truncate" title={item.label}>{item.label}</span>
            </AdminNavLink>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
