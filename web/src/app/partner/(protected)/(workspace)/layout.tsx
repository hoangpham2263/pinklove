import Link from "next/link";
import { ExternalLink, LayoutDashboard, PackagePlus, PackageSearch, Settings } from "lucide-react";

import { VendorWorkspaceNavLink } from "@/features/vendor-orders/components/vendor-workspace-nav-link";
import { VendorWorkspaceTopHeader } from "@/features/vendor-orders/components/vendor-workspace-top-header";
import { ensureVendorPortalSlug, requireVendor } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

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
  const navItems = [
    { href: ROUTES.PARTNER.LEGACY_DASHBOARD, label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: ROUTES.PARTNER.LEGACY_ORDERS, label: "Đơn được giao", icon: PackageSearch, matchPrefixes: [ROUTES.PARTNER.LEGACY_ORDERS, ROUTES.PARTNER.ORDER("").slice(0, -1)] },
    { href: ROUTES.PARTNER.PRODUCTS, label: "Sản phẩm", icon: PackagePlus, matchPrefixes: [ROUTES.PARTNER.PRODUCTS] },
    { href: ROUTES.PARTNER.CONFIG, label: "Configs", icon: Settings, matchPrefixes: [ROUTES.PARTNER.CONFIG] },
  ];

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
            {navItems.map((item) => {
              const Icon = item.icon;
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
          <Link href={ROUTES.HOME} className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted">
            <ExternalLink className="h-5 w-5" />
            Xem Website
          </Link>
        </div>
      </aside>

      <main className="min-h-screen min-w-0 bg-muted/30 md:col-span-10">
        <VendorWorkspaceTopHeader username={vendor.username} portalHref={portalHref} />
        <section className="min-h-screen pt-14">{children}</section>
      </main>
    </div>
  );
}
