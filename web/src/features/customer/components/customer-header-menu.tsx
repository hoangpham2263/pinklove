"use client";

import { useState } from "react";
import {
  BadgePercent,
  ChevronRight,
  ExternalLink,
  FolderHeart,
  LayoutDashboard,
  Link as LinkIcon,
  LogOut,
  MapPin,
  Menu as MenuIcon,
  MessageCircle,
  Settings,
  ShoppingBag,
  Store,
  User as UserIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  CUSTOMER_NAV_AUXILIARY_ITEMS,
  CUSTOMER_NAV_GROUPS,
  CUSTOMER_NAV_PRIMARY_ITEMS,
  CUSTOMER_NAV_SECONDARY_ITEMS,
  type CustomerNavChild,
  type CustomerNavGroupEntry,
  type CustomerNavLinkEntry,
} from "@/features/customer/config/navigation";
import { CustomerNavLink } from "@/features/customer/components/customer-nav-link";
import { CustomerIconButton, CustomerNavSubmitButton } from "@/features/customer/ui/customer-buttons";
import { isRouteActive } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

const customerMobileIconMap = {
  "layout-dashboard": LayoutDashboard,
  "map-pin": MapPin,
  "folder-heart": FolderHeart,
  "shopping-bag": ShoppingBag,
  "message-circle": MessageCircle,
  user: UserIcon,
  "badge-percent": BadgePercent,
  link: LinkIcon,
  settings: Settings,
  store: Store,
  "external-link": ExternalLink,
} satisfies Record<string, React.ComponentType<{ className?: string }>>;

function MenuChildItem({
  item,
  onNavigate,
}: {
  item: CustomerNavChild;
  onNavigate: () => void;
}) {
  const Icon = customerMobileIconMap[item.iconName];

  return (
    <CustomerNavLink
      href={item.href}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
      onNavigate={onNavigate}
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </CustomerNavLink>
  );
}

function MenuGroup({
  group,
  onNavigate,
}: {
  group: CustomerNavGroupEntry;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const GroupIcon = customerMobileIconMap[group.iconName];
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
  item: CustomerNavLinkEntry;
  onNavigate: () => void;
}) {
  const Icon = customerMobileIconMap[item.iconName];

  return (
    <CustomerNavLink
      href={item.href}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
      onNavigate={onNavigate}
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </CustomerNavLink>
  );
}

export function CustomerHeaderMenu() {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <CustomerIconButton
        className="rounded-full md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <MenuIcon className="h-4 w-4" />
      </CustomerIconButton>

      <SheetContent side="left" className="w-[min(22rem,calc(100vw-2rem))] rounded-r-2xl p-0 md:hidden">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="text-base">Menu</SheetTitle>
        </SheetHeader>

        <div className="customer-sidebar-scroll flex max-h-[calc(100vh-5rem)] flex-col gap-2 overflow-y-auto px-3 py-3">
          {CUSTOMER_NAV_PRIMARY_ITEMS.map((item) => (
            <StandaloneItem key={item.href} item={item} onNavigate={closeMenu} />
          ))}

          <div className="my-1 border-t" />

          {CUSTOMER_NAV_GROUPS.map((entry) => (
            <MenuGroup key={entry.label} group={entry} onNavigate={closeMenu} />
          ))}

          {CUSTOMER_NAV_SECONDARY_ITEMS.length > 0 ? (
            <>
              <div className="my-1 border-t" />
              {CUSTOMER_NAV_SECONDARY_ITEMS.map((item) => (
                <StandaloneItem key={item.href} item={item} onNavigate={closeMenu} />
              ))}
            </>
          ) : null}

          <div className="my-1 border-t" />

          {CUSTOMER_NAV_AUXILIARY_ITEMS.map((item) => (
            <StandaloneItem key={item.href} item={item} onNavigate={closeMenu} />
          ))}

          <form action={ROUTES.AUTH.LOGOUT_API} method="POST">
            <CustomerNavSubmitButton>
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </CustomerNavSubmitButton>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
