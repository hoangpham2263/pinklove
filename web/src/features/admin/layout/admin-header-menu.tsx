"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BadgePercent,
  Bell,
  Blocks,
  BookOpenText,
  ChevronRight,
  CreditCard,
  ExternalLink,
  FileCode2,
  Files,
  Image as ImageIcon,
  LayoutDashboard,
  ListTree,
  LogOut,
  Menu as MenuIcon,
  MessageCircle,
  MessagesSquare,
  Package,
  ReceiptText,
  Settings,
  ShoppingBag,
  Store,
  Tags,
  Truck,
  Users,
} from "lucide-react";
import { AdminIconButton, AdminNavSubmitButton } from "@/features/admin/components/admin-buttons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  ADMIN_NAV_AUXILIARY_ITEMS,
  ADMIN_NAV_GROUPS,
  ADMIN_NAV_PRIMARY_ITEMS,
  ADMIN_NAV_SECONDARY_ITEMS,
  type AdminNavChild,
  type AdminNavGroup,
  type AdminStandaloneNavItem,
} from "@/features/admin/config/navigation";
import { AdminNavLink } from "@/features/admin/layout/admin-nav-link";
import { isRouteActive } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { usePathname } from "next/navigation";

const adminMobileIconMap = {
  "layout-dashboard": LayoutDashboard,
  files: Files,
  "file-code-2": FileCode2,
  blocks: Blocks,
  package: Package,
  tags: Tags,
  "receipt-text": ReceiptText,
  "credit-card": CreditCard,
  truck: Truck,
  menu: MenuIcon,
  "message-circle": MessageCircle,
  "messages-square": MessagesSquare,
  bell: Bell,
  image: ImageIcon,
  "shopping-bag": ShoppingBag,
  users: Users,
  store: Store,
  "badge-percent": BadgePercent,
  settings: Settings,
  "external-link": ExternalLink,
  "book-open-text": BookOpenText,
  "list-tree": ListTree,
} satisfies Record<string, React.ComponentType<{ className?: string }>>;

function MenuChildItem({
  item,
  onNavigate,
}: {
  item: AdminNavChild;
  onNavigate: () => void;
}) {
  return (
    <AdminNavLink
      href={item.href}
      className="flex items-center rounded-lg px-3 py-2.5 transition-colors"
      onClick={onNavigate}
    >
      <span>{item.label}</span>
    </AdminNavLink>
  );
}

function MenuGroup({
  group,
  onNavigate,
}: {
  group: AdminNavGroup;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const GroupIcon = adminMobileIconMap[group.iconName];
  const hasActiveItem = group.children.some((item) => isRouteActive(pathname, item.href, true));

  return (
    <Collapsible defaultOpen={group.defaultOpen || hasActiveItem} className="group/collapsible">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted">
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

function StandaloneItem({
  item,
  onNavigate,
}: {
  item: AdminStandaloneNavItem;
  onNavigate: () => void;
}) {
  const Icon = adminMobileIconMap[item.iconName];

  if (item.iconName === "external-link") {
    return (
      <Link
        href={item.href}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
        onClick={onNavigate}
      >
        <Icon className="h-4 w-4" />
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <AdminNavLink
      href={item.href}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
      onClick={onNavigate}
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </AdminNavLink>
  );
}

export function AdminHeaderMenu() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <AdminIconButton
        className="rounded-full md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <MenuIcon className="h-4 w-4" />
      </AdminIconButton>

      <SheetContent side="left" className="w-[min(22rem,calc(100vw-2rem))] rounded-r-2xl p-0 md:hidden">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="text-base">Menu</SheetTitle>
        </SheetHeader>

        <div className="flex max-h-[calc(100vh-5rem)] flex-col gap-2 overflow-y-auto px-3 py-3">
          {ADMIN_NAV_PRIMARY_ITEMS.map((item) => (
            <StandaloneItem key={item.href} item={item} onNavigate={() => setOpen(false)} />
          ))}

          <div className="my-1 border-t" />

          {ADMIN_NAV_GROUPS.map((group) => (
            <MenuGroup key={group.label} group={group} onNavigate={() => setOpen(false)} />
          ))}

          <div className="my-1 border-t" />

          {ADMIN_NAV_SECONDARY_ITEMS.map((item) => (
            <StandaloneItem key={item.href} item={item} onNavigate={() => setOpen(false)} />
          ))}

          <div className="my-1 border-t" />

          {ADMIN_NAV_AUXILIARY_ITEMS.map((item) => (
            <StandaloneItem key={item.href} item={item} onNavigate={() => setOpen(false)} />
          ))}

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
