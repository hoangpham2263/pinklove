import Image from "next/image";
import Link from "next/link";
import {
  BadgePercent,
  BookOpenText,
  ExternalLink,
  Files,
  Image as ImageIcon,
  LayoutDashboard,
  Menu as MenuIcon,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react";

import { ADMIN_MOBILE_NAV, ADMIN_NAV_GROUPS } from "@/features/admin/config/navigation";
import { AdminNavLink } from "@/features/admin/layout/admin-nav-link";
import { AdminSidebarGroup } from "@/features/admin/layout/admin-sidebar-group";
import { AdminTopHeader } from "@/features/admin/layout/admin-top-header";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

const adminMobileIconMap = {
  "layout-dashboard": LayoutDashboard,
  files: Files,
  menu: MenuIcon,
  image: ImageIcon,
  "shopping-bag": ShoppingBag,
  users: Users,
  "badge-percent": BadgePercent,
  settings: Settings,
  "external-link": ExternalLink,
  "book-open-text": BookOpenText,
} satisfies Record<string, React.ComponentType<{ className?: string }>>;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, settings] = await Promise.all([requireAdmin(), getSystemSettings()]);

  return (
    <div className="min-h-screen md:grid md:grid-cols-12">
      <aside className="admin-sidebar-scroll hidden border-r bg-background p-5 md:sticky md:top-0 md:col-span-2 md:flex md:h-screen md:flex-col md:gap-3">
        <div className="mb-6 flex items-center gap-2 px-3">
          {settings.branding.brandLogo ? (
            <Image
              src={settings.branding.brandLogo}
              alt={settings.branding.siteName}
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <>
              <div className="h-6 w-6 rounded-bg bg-primary" />
              <h2 className="text-lg font-bold tracking-tight">{settings.branding.siteName || "PinkLove"}</h2>
            </>
          )}
        </div>

        <nav className="flex flex-col gap-2.5">
          <AdminNavLink href={ROUTES.ADMIN.DASHBOARD} className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors">
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </AdminNavLink>

          <AdminNavLink href={ROUTES.ADMIN.MEDIA} className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors">
            <ImageIcon className="h-5 w-5" />
            <span>Media</span>
          </AdminNavLink>

          {ADMIN_NAV_GROUPS.map((group) => (
            <AdminSidebarGroup
              key={group.label}
              label={group.label}
              iconName={group.iconName}
              items={group.children}
              defaultOpen={group.defaultOpen}
            />
          ))}

          <AdminNavLink href={ROUTES.ADMIN.GLOBAL_FIELDS} className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors">
            <BookOpenText className="h-5 w-5" />
            <span>Global Fields</span>
          </AdminNavLink>

          <AdminNavLink href={ROUTES.ADMIN.CONFIG} className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors">
            <Settings className="h-5 w-5" />
            <span>Cấu hình</span>
          </AdminNavLink>

          <div className="mt-auto border-t pt-4">
            <Link href={ROUTES.HOME} className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted">
              <ExternalLink className="h-5 w-5" />
              Xem Website
            </Link>
          </div>
        </nav>
      </aside>

      <main className="min-h-screen min-w-0 bg-muted/30 md:col-span-10">
        <AdminTopHeader username={user.username} />

        <section className="min-h-screen">
          <section className="border-b bg-background px-4 py-2 md:hidden">
            <nav className="flex gap-4 overflow-x-auto py-1">
              {ADMIN_MOBILE_NAV.map((entry, index) => {
                if (entry.type === "separator") {
                  return <div key={`separator-${index}`} className="my-1 w-px shrink-0 bg-border" />;
                }

                const Icon = adminMobileIconMap[entry.iconName];
                return (
                  <AdminNavLink
                    key={entry.href}
                    href={entry.href}
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                    {entry.label}
                  </AdminNavLink>
                );
              })}

              <Link href={ROUTES.HOME} className="flex items-center gap-1.5 whitespace-nowrap">
                <ExternalLink className="h-4 w-4" />
                Xem website
              </Link>
            </nav>
          </section>

          <section className="min-h-screen">
            <div>{children}</div>
          </section>
        </section>
      </main>
    </div>
  );
}
