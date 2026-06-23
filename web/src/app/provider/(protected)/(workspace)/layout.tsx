import Link from "next/link";

import { ProviderWorkspaceNavLink } from "@/features/provider-orders/components/provider-workspace-nav-link";
import { ProviderWorkspaceTopHeader } from "@/features/provider-orders/components/provider-workspace-top-header";
import { PROVIDER_NAV_AUXILIARY_ITEMS, getProviderNavItems } from "@/features/provider-orders/config/navigation";
import { PROVIDER_NAV_ICON_MAP } from "@/features/provider-orders/config/navigation-icons";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

export default async function ProviderWorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const provider = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const settings = await getSystemSettings();
  const portalHref = ROUTES.PROVIDER.ROOT;
  const navItems = getProviderNavItems();

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
            {navItems.map((item) => {
              const Icon = PROVIDER_NAV_ICON_MAP[item.iconName];
              return (
                <ProviderWorkspaceNavLink
                  key={item.key}
                  href={item.href}
                  exact={item.type === "link" ? item.exact : undefined}
                  matchPrefixes={item.matchPrefixes}
                  excludePaths={item.excludePaths}
                  excludePrefixes={item.excludePrefixes}
                  className="flex min-w-0 items-center gap-3 rounded-md px-3 py-2 transition-colors"
                  activeClassName="bg-muted"
                  inactiveClassName="hover:bg-muted"
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate" title={item.label}>{item.label}</span>
                </ProviderWorkspaceNavLink>
              );
            })}
          </div>
        </nav>

        <div className="mt-4 shrink-0 border-t pt-4">
          {PROVIDER_NAV_AUXILIARY_ITEMS.map((item) => {
            const Icon = PROVIDER_NAV_ICON_MAP[item.iconName];
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
        <ProviderWorkspaceTopHeader
          accountName={provider.accountName}
          portalHref={portalHref}
          breadcrumbEnabled={settings.breadcrumb.providerEnabled}
          breadcrumbSeparator={settings.breadcrumb.providerSeparator}
        />
        <section className="min-h-screen pt-14">{children}</section>
      </main>
    </div>
  );
}
