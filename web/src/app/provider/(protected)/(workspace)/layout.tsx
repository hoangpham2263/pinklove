import Link from "next/link";
import {
  ExternalLink,
  CalendarClock,
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

import { ProviderWorkspaceNavLink } from "@/features/provider-orders/components/provider-workspace-nav-link";
import { ProviderWorkspaceSidebarGroup } from "@/features/provider-orders/components/provider-workspace-sidebar-group";
import { ProviderWorkspaceTopHeader } from "@/features/provider-orders/components/provider-workspace-top-header";
import {
  PROVIDER_NAV_AUXILIARY_ITEMS,
  PROVIDER_NAV_GROUPS,
  PROVIDER_NAV_PRIMARY_ITEMS,
  PROVIDER_NAV_SECONDARY_ITEMS,
} from "@/features/provider-orders/config/navigation";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

const providerIconMap = {
  "calendar-clock": CalendarClock,
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
};

export default async function ProviderWorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const provider = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const settings = await getSystemSettings();
  const portalHref = ROUTES.PROVIDER.ROOT;

  return (
    <div className="min-h-screen md:grid md:grid-cols-11">
      <aside className="hidden border-r bg-background p-5 md:sticky md:top-0 md:col-span-2 md:flex md:h-screen md:flex-col md:overflow-hidden">
        <div className="mb-6 shrink-0 px-3">
          {settings.branding.brandLogo ? (
            <img src={settings.branding.brandLogo} alt={settings.branding.siteName} className="h-10 w-auto max-w-[120px] object-contain" />
          ) : (
            <h2 className="text-lg font-bold tracking-tight">{settings.branding.siteName}</h2>
          )}
        </div>

        <nav className="admin-sidebar-scroll min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="flex flex-col gap-2.5">
            {PROVIDER_NAV_PRIMARY_ITEMS.map((item) => {
              const Icon = providerIconMap[item.iconName];
              return (
                <ProviderWorkspaceNavLink
                  key={item.href}
                  href={item.href}
                  exact={item.exact}
                  matchPrefixes={item.matchPrefixes}
                  excludePaths={item.excludePaths}
                  excludePrefixes={item.excludePrefixes}
                  className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors"
                  activeClassName="bg-muted"
                  inactiveClassName="hover:bg-muted"
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </ProviderWorkspaceNavLink>
              );
            })}

            {PROVIDER_NAV_GROUPS.map((entry) => (
              <ProviderWorkspaceSidebarGroup
                key={entry.label}
                label={entry.label}
                iconName={entry.iconName}
                items={entry.children}
                defaultOpen={entry.defaultOpen}
              />
            ))}

            {PROVIDER_NAV_SECONDARY_ITEMS.map((item) => {
              const Icon = providerIconMap[item.iconName];
              return (
                <ProviderWorkspaceNavLink
                  key={item.href}
                  href={item.href}
                  exact={item.exact}
                  matchPrefixes={item.matchPrefixes}
                  excludePaths={item.excludePaths}
                  excludePrefixes={item.excludePrefixes}
                  className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors"
                  activeClassName="bg-muted"
                  inactiveClassName="hover:bg-muted"
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </ProviderWorkspaceNavLink>
              );
            })}
          </div>
        </nav>

        <div className="mt-4 shrink-0 border-t pt-4">
          {PROVIDER_NAV_AUXILIARY_ITEMS.map((item) => {
            const Icon = providerIconMap[item.iconName];
            return (
              <Link
                key={item.href}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted"
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </aside>

      <main className="min-h-screen min-w-0 bg-muted/30 md:col-span-9">
        <ProviderWorkspaceTopHeader
          username={provider.username}
          portalHref={portalHref}
          breadcrumbEnabled={settings.breadcrumb.providerEnabled}
          breadcrumbSeparator={settings.breadcrumb.providerSeparator}
        />
        <section className="min-h-screen pt-14">{children}</section>
      </main>
    </div>
  );
}
