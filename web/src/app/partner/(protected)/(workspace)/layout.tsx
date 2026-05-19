import Link from "next/link";
import {
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

import { VendorWorkspaceNavLink } from "@/features/vendor-orders/components/vendor-workspace-nav-link";
import { VendorWorkspaceSidebarGroup } from "@/features/vendor-orders/components/vendor-workspace-sidebar-group";
import { VendorWorkspaceTopHeader } from "@/features/vendor-orders/components/vendor-workspace-top-header";
import {
  VENDOR_NAV_AUXILIARY_ITEMS,
  VENDOR_NAV_GROUPS,
  VENDOR_NAV_PRIMARY_ITEMS,
  VENDOR_NAV_SECONDARY_ITEMS,
} from "@/features/vendor-orders/config/navigation";
import { ensureVendorPortalSlug, requireVendor } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

const vendorIconMap = {
  "layout-dashboard": LayoutDashboard,
  "map-pin": MapPin,
  "package-check": PackageCheck,
  "package-plus": PackagePlus,
  "package-search": PackageSearch,
  settings: Settings,
  "shopping-bag": ShoppingBag,
  user: UserIcon,
  "external-link": ExternalLink,
};

export default async function PartnerWorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const vendor = await requireVendor(ROUTES.PARTNER.LOGIN);
  const [settings, portalSlug] = await Promise.all([
    getSystemSettings(),
    ensureVendorPortalSlug(vendor.id),
  ]);
  const portalHref = portalSlug ? ROUTES.PARTNER.PORTAL(portalSlug) : ROUTES.PARTNER.ROOT;

  return (
    <div className="min-h-screen md:grid md:grid-cols-12">
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
            {VENDOR_NAV_PRIMARY_ITEMS.map((item) => {
              const Icon = vendorIconMap[item.iconName];
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
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </VendorWorkspaceNavLink>
              );
            })}

            {VENDOR_NAV_GROUPS.map((entry) => (
              <VendorWorkspaceSidebarGroup
                key={entry.label}
                label={entry.label}
                iconName={entry.iconName}
                items={entry.children}
                defaultOpen={entry.defaultOpen}
              />
            ))}

            {VENDOR_NAV_SECONDARY_ITEMS.map((item) => {
              const Icon = vendorIconMap[item.iconName];
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
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </VendorWorkspaceNavLink>
              );
            })}
          </div>
        </nav>

        <div className="mt-4 shrink-0 border-t pt-4">
          {VENDOR_NAV_AUXILIARY_ITEMS.map((item) => {
            const Icon = vendorIconMap[item.iconName];
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

      <main className="min-h-screen min-w-0 bg-muted/30 md:col-span-10">
        <VendorWorkspaceTopHeader
          username={vendor.username}
          portalHref={portalHref}
          breadcrumbEnabled={settings.breadcrumb.partnerEnabled}
          breadcrumbSeparator={settings.breadcrumb.partnerSeparator}
        />
        <section className="min-h-screen pt-14">{children}</section>
      </main>
    </div>
  );
}
