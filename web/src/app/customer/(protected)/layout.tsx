import Image from "next/image";
import Link from "next/link";
import {
  BadgePercent,
  ExternalLink,
  FolderHeart,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  Store,
  User as UserIcon,
} from "lucide-react";

import { CUSTOMER_MOBILE_NAV, getCustomerNavGroups } from "@/features/customer/config/navigation";
import { CustomerNavLink } from "@/features/customer/components/customer-nav-link";
import { CustomerSidebarGroup } from "@/features/customer/components/customer-sidebar-group";
import { CustomerTopHeader } from "@/features/customer/components/customer-top-header";
import { requireAppUser } from "@/lib/auth";
import { isVendorRole } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

const customerMobileIconMap = {
  "layout-dashboard": LayoutDashboard,
  "folder-heart": FolderHeart,
  "shopping-bag": ShoppingBag,
  user: UserIcon,
  "badge-percent": BadgePercent,
  settings: Settings,
  store: Store,
} satisfies Record<string, React.ComponentType<{ className?: string }>>;

export default async function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, settings] = await Promise.all([requireAppUser(ROUTES.AUTH.LOGIN), getSystemSettings()]);
  const customerNavGroups = getCustomerNavGroups();

  return (
    <div className="min-h-screen md:grid md:grid-cols-12">
      <aside className="admin-sidebar-scroll hidden overflow-y-auto border-r bg-background p-5 md:sticky md:top-0 md:col-span-2 md:flex md:h-screen md:flex-col md:gap-3">
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
          <CustomerNavLink
            href={ROUTES.CUSTOMER.DASHBOARD}
            className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </CustomerNavLink>

          {customerNavGroups.map((group) => (
            <CustomerSidebarGroup
              key={group.label}
              label={group.label}
              iconName={group.iconName}
              items={group.children}
              defaultOpen={group.defaultOpen}
            />
          ))}

          {isVendorRole(user.role) ? (
            <CustomerNavLink
              href={ROUTES.CUSTOMER.VENDOR}
              className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors"
            >
              <Store className="h-5 w-5" />
              <span>Vendor</span>
            </CustomerNavLink>
          ) : null}

          <div className="mt-auto border-t pt-4">
            <Link href={ROUTES.HOME} className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted">
              <ExternalLink className="h-5 w-5" />
              Xem Website
            </Link>
          </div>
        </nav>
      </aside>

      <main className="min-h-screen bg-[#f9f9f9] bg-muted/30 md:col-span-10">
        <CustomerTopHeader username={user.username} />

        <section className="min-h-screen">
          <section className="border-b bg-background px-4 py-2 md:hidden">
            <nav className="flex gap-4 overflow-x-auto py-1">
              {CUSTOMER_MOBILE_NAV.map((entry) => {
                const Icon = customerMobileIconMap[entry.iconName];
                return (
                  <CustomerNavLink
                    key={entry.href}
                    href={entry.href}
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                    {entry.label}
                  </CustomerNavLink>
                );
              })}

              {isVendorRole(user.role) ? (
                <CustomerNavLink
                  href={ROUTES.CUSTOMER.VENDOR}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors"
                >
                  <Store className="h-4 w-4" />
                  Vendor
                </CustomerNavLink>
              ) : null}
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
