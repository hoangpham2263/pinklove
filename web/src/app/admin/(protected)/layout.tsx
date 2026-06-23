import Link from "next/link";
import { headers } from "next/headers";

import {
  ADMIN_FEATURES,
  ADMIN_NAV_AUXILIARY_ITEMS,
  canAccessAdminFeature,
} from "@/features/admin/config/navigation";
import { ADMIN_NAV_ICON_MAP } from "@/features/admin/config/navigation-icons";
import { AdminNavLink } from "@/features/admin/layout/admin-nav-link";
import { AdminTopHeader } from "@/features/admin/layout/admin-top-header";
import { requireAdmin } from "@/lib/auth";
import { getSystemSettings } from "@/lib/system-settings";
import { getAdminAccessContext } from "@/features/access/server/service";
import { getAdminPathPermission } from "@/features/access/config/permissions";
import { ROUTES } from "@/lib/routes";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, settings, requestHeaders] = await Promise.all([requireAdmin(), getSystemSettings(), headers()]);
  const access = await getAdminAccessContext(user.id);
  const permissionKeys = access?.isSuperAdmin ? undefined : access?.permissionKeys ?? [];
  const allowed = (permission?: string) => !permissionKeys || !permission || permissionKeys.includes(permission);
  const pathname = requestHeaders.get("x-admin-pathname") ?? ROUTES.ADMIN.DASHBOARD;
  const requestedFeature = ADMIN_FEATURES.find((feature) => feature.href === pathname);
  const canViewPage = requestedFeature
    ? canAccessAdminFeature(requestedFeature, permissionKeys)
    : allowed(getAdminPathPermission(pathname));
  const visibleFeatures = ADMIN_FEATURES.filter((feature) => canAccessAdminFeature(feature, permissionKeys));

  return (
    <div className="min-h-screen md:grid md:grid-cols-11">
      <aside className="hidden border-r bg-background p-5 md:sticky md:top-0 md:col-span-2 md:flex md:h-screen md:flex-col md:overflow-hidden">
        <div className="mb-6 shrink-0 px-3">
          {settings.branding.brandLogo ? (
            <img
              src={settings.branding.brandLogo}
              alt={settings.branding.siteName}
              className="h-10 w-auto max-w-[120px] object-contain"
            />
          ) : (
            <h2 className="text-lg font-bold tracking-tight">
              {settings.branding.siteName}
            </h2>
          )}
        </div>

        <nav className="admin-sidebar-scroll min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="flex flex-col gap-2.5">
            {visibleFeatures.map((feature) => {
              const Icon = ADMIN_NAV_ICON_MAP[feature.iconName];

              return (
                <AdminNavLink
                  key={feature.key}
                  href={feature.href}
                  exact={feature.exact}
                  matchPrefixes={feature.matchPrefixes}
                  excludePrefixes={feature.excludePrefixes}
                  className="flex min-w-0 items-center gap-3 rounded-md px-3 py-2 transition-colors"
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate" title={feature.label}>{feature.label}</span>
                </AdminNavLink>
              );
            })}
          </div>
        </nav>

        <div className="mt-4 shrink-0 border-t pt-4">
          {ADMIN_NAV_AUXILIARY_ITEMS.map((item) => {
            const Icon = ADMIN_NAV_ICON_MAP[item.iconName];

            return (
              <Link key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted">
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate" title={item.label}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </aside>

      <main className="min-h-screen min-w-0 bg-muted/30 md:col-span-9">
        <AdminTopHeader
          accountName={user.accountName}
          permissionKeys={permissionKeys}
          breadcrumbEnabled={settings.breadcrumb.adminEnabled}
          breadcrumbSeparator={settings.breadcrumb.adminSeparator}
        />
        <section className="min-h-screen pt-14">
          {canViewPage ? children : <div className="p-7.5"><h1 className="text-2xl font-semibold">403</h1><p className="text-muted-foreground">Bạn không có quyền truy cập khu vực này.</p></div>}
        </section>
      </main>
    </div>
  );
}
