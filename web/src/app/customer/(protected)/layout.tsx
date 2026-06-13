import Link from "next/link";
import {
  BadgePercent,
  CalendarClock,
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

import {
  CUSTOMER_NAV_AUXILIARY_ITEMS,
  CUSTOMER_NAV_GROUPS,
  CUSTOMER_NAV_PARTNER_GROUPS,
  CUSTOMER_NAV_PRIMARY_ITEMS,
  CUSTOMER_NAV_SECONDARY_ITEMS,
} from "@/features/customer/config/navigation";
import { CustomerNavLink } from "@/features/customer/components/customer-nav-link";
import { CustomerSidebarGroup } from "@/features/customer/components/customer-sidebar-group";
import { CustomerTopHeader } from "@/features/customer/components/customer-top-header";
import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

const customerMobileIconMap = {
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
} satisfies Record<string, React.ComponentType<{ className?: string }>>;

export default async function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, settings] = await Promise.all([requireAppUser(ROUTES.AUTH.LOGIN), getSystemSettings()]);

  return (
    <div className="customer-shell min-h-screen md:grid md:grid-cols-11">
      <aside className="hidden border-r bg-background p-5 md:sticky md:top-0 md:col-span-2 md:flex md:h-screen md:flex-col md:overflow-hidden">
        <div className="mb-6 shrink-0 px-3">
          {settings.branding.brandLogo ? (
            <img
              src={settings.branding.brandLogo}
              alt={settings.branding.siteName}
              className="h-10 w-auto max-w-[120px] object-contain"
            />
          ) : (
            <h2 className="text-lg font-bold tracking-tight">{settings.branding.siteName}</h2>
          )}
        </div>

        <nav className="customer-sidebar-scroll min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="flex flex-col gap-2.5">
            <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Chính</p>
            {CUSTOMER_NAV_PRIMARY_ITEMS.map((item) => {
              const Icon = customerMobileIconMap[item.iconName];
              return (
                <CustomerNavLink
                  key={item.href}
                  href={item.href}
                  className="flex min-w-0 items-center gap-3 rounded-md px-3 py-2 transition-colors"
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate" title={item.label}>{item.label}</span>
                </CustomerNavLink>
              );
            })}

            <div className="my-1 border-t" />
            <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Khu khách hàng</p>

            {CUSTOMER_NAV_GROUPS.map((entry) => (
              <CustomerSidebarGroup
                key={entry.label}
                label={entry.label}
                iconName={entry.iconName}
                items={entry.children}
                defaultOpen={entry.defaultOpen}
              />
            ))}

            <div className="my-1 border-t" />
            <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Khu đối tác</p>

            {CUSTOMER_NAV_PARTNER_GROUPS.map((entry) => (
              <CustomerSidebarGroup
                key={entry.label}
                label={entry.label}
                iconName={entry.iconName}
                items={entry.children}
                defaultOpen={entry.defaultOpen}
              />
            ))}

            {CUSTOMER_NAV_SECONDARY_ITEMS.length > 0 ? (
              <>
                <div className="my-1 border-t" />
                {CUSTOMER_NAV_SECONDARY_ITEMS.map((item) => {
                  const Icon = customerMobileIconMap[item.iconName];
                  return (
                    <CustomerNavLink
                      key={item.href}
                      href={item.href}
                      className="flex min-w-0 items-center gap-3 rounded-md px-3 py-2 transition-colors"
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="truncate" title={item.label}>{item.label}</span>
                    </CustomerNavLink>
                  );
                })}
              </>
            ) : null}
          </div>
        </nav>

        <div className="mt-4 shrink-0 border-t pt-4">
          {CUSTOMER_NAV_AUXILIARY_ITEMS.map((item) => {
            const Icon = customerMobileIconMap[item.iconName];
            return (
              <Link
                key={item.href}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="flex min-w-0 items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted"
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate" title={item.label}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </aside>

      <main className="min-h-screen min-w-0 bg-muted/30 md:col-span-9">
        <CustomerTopHeader
          username={user.username}
          breadcrumbEnabled={settings.breadcrumb.customerEnabled}
          breadcrumbSeparator={settings.breadcrumb.customerSeparator}
        />
        <section className="min-h-screen pt-14">
          {children}
        </section>
      </main>
    </div>
  );
}
