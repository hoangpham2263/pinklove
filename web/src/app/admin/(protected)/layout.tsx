import Link from "next/link";
import { headers } from "next/headers";
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
  ExternalLink,
  FileCode2,
  Files,
  Image as ImageIcon,
  LayoutDashboard,
  ListTree,
  Menu,
  MessageCircle,
  MessagesSquare,
  Package,
  Radio,
  ReceiptText,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Tags,
  Truck,
  Users,
} from "lucide-react";

import {
  ADMIN_NAV_AUXILIARY_ITEMS,
  ADMIN_NAV_GROUPS,
  ADMIN_NAV_PRIMARY_ITEMS,
  ADMIN_NAV_SECONDARY_ITEMS,
} from "@/features/admin/config/navigation";
import { AdminNavLink } from "@/features/admin/layout/admin-nav-link";
import { AdminSidebarGroup } from "@/features/admin/layout/admin-sidebar-group";
import { AdminTopHeader } from "@/features/admin/layout/admin-top-header";
import { requireAdmin } from "@/lib/auth";
import { getSystemSettings } from "@/lib/system-settings";
import { getAdminAccessContext } from "@/features/access/server/service";
import { getAdminPathPermission } from "@/features/access/config/permissions";
import { ROUTES } from "@/lib/routes";

const standaloneIconMap = {
  "layout-dashboard": LayoutDashboard,
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
  menu: Menu,
  "message-circle": MessageCircle,
  "messages-square": MessagesSquare,
  bell: Bell,
  image: ImageIcon,
  "book-open-text": BookOpenText,
  "list-tree": ListTree,
  users: Users,
  store: Store,
  "badge-percent": BadgePercent,
  settings: Settings,
  "external-link": ExternalLink,
} satisfies Record<string, React.ComponentType<{ className?: string }>>;

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
  const canViewPage = allowed(getAdminPathPermission(pathname));
  const visibleGroups = ADMIN_NAV_GROUPS.filter((group) => allowed(group.permission)).map((group) => ({
    ...group,
    children: group.children.filter((item) => allowed(item.permission)),
  })).filter((group) => group.children.length > 0);

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
            {ADMIN_NAV_PRIMARY_ITEMS.filter((item) => allowed(item.permission)).map((item) => {
              const Icon = standaloneIconMap[item.iconName];

              return (
                <AdminNavLink
                  key={item.href}
                  href={item.href}
                  exact={item.exact}
                  matchPrefixes={item.matchPrefixes}
                  excludePaths={item.excludePaths}
                  excludePrefixes={item.excludePrefixes}
                  className="flex min-w-0 items-center gap-3 rounded-md px-3 py-2 transition-colors"
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate" title={item.label}>{item.label}</span>
                </AdminNavLink>
              );
            })}

            {visibleGroups.map((group) => (
              <AdminSidebarGroup
                key={group.label}
                label={group.label}
                iconName={group.iconName}
                items={group.children}
                defaultOpen={group.defaultOpen}
              />
            ))}

            {ADMIN_NAV_SECONDARY_ITEMS.filter((item) => allowed(item.permission)).map((item) => {
              const Icon = standaloneIconMap[item.iconName];

              return (
                <AdminNavLink
                  key={item.href}
                  href={item.href}
                  exact={item.exact}
                  matchPrefixes={item.matchPrefixes}
                  excludePaths={item.excludePaths}
                  excludePrefixes={item.excludePrefixes}
                  className="flex min-w-0 items-center gap-3 rounded-md px-3 py-2 transition-colors"
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate" title={item.label}>{item.label}</span>
                </AdminNavLink>
              );
            })}
          </div>
        </nav>

        <div className="mt-4 shrink-0 border-t pt-4">
          {ADMIN_NAV_AUXILIARY_ITEMS.map((item) => {
            const Icon = standaloneIconMap[item.iconName];

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
          username={user.username}
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
