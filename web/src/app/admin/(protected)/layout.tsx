import Link from "next/link";
import {
  BadgePercent,
  Blocks,
  BookOpenText,
  CreditCard,
  ExternalLink,
  FileCode2,
  Files,
  Image as ImageIcon,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Package,
  ReceiptText,
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

const standaloneIconMap = {
  "layout-dashboard": LayoutDashboard,
  files: Files,
  "file-code-2": FileCode2,
  blocks: Blocks,
  package: Package,
  tags: Tags,
  "receipt-text": ReceiptText,
  "credit-card": CreditCard,
  truck: Truck,
  "shopping-bag": ShoppingBag,
  menu: Menu,
  "message-circle": MessageCircle,
  image: ImageIcon,
  "book-open-text": BookOpenText,
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
  const [user, settings] = await Promise.all([requireAdmin(), getSystemSettings()]);

  return (
    <div className="min-h-screen md:grid md:grid-cols-12">
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
            {ADMIN_NAV_PRIMARY_ITEMS.map((item) => {
              const Icon = standaloneIconMap[item.iconName];

              return (
                <AdminNavLink key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors">
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </AdminNavLink>
              );
            })}

            {ADMIN_NAV_GROUPS.map((group) => (
              <AdminSidebarGroup
                key={group.label}
                label={group.label}
                iconName={group.iconName}
                items={group.children}
                defaultOpen={group.defaultOpen}
              />
            ))}

            {ADMIN_NAV_SECONDARY_ITEMS.map((item) => {
              const Icon = standaloneIconMap[item.iconName];

              return (
                <AdminNavLink key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors">
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </AdminNavLink>
              );
            })}
          </div>
        </nav>

        <div className="mt-4 shrink-0 border-t pt-4">
          {ADMIN_NAV_AUXILIARY_ITEMS.map((item) => {
            const Icon = standaloneIconMap[item.iconName];

            return (
              <Link key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted">
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </aside>

      <main className="min-h-screen min-w-0 bg-muted/30 md:col-span-10">
        <AdminTopHeader username={user.username} />
        <section className="min-h-screen pt-14">{children}</section>
      </main>
    </div>
  );
}
