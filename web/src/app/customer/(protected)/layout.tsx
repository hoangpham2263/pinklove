import Link from "next/link";
import {
  LayoutDashboard,
  FolderHeart,
  ShoppingBag,
  User as UserIcon,
  BadgePercent,
  Settings,
  Store,
  ExternalLink
} from "lucide-react";

import { CustomerTopHeader } from "@/features/customer/components/customer-top-header";
import { CustomerNavLink } from "@/features/customer/components/customer-nav-link";
import { CustomerSidebarGroup } from "@/features/customer/components/customer-sidebar-group";
import { requireAppUser } from "@/lib/auth";
import { isVendorRole } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

type CustomerNavChild = {
  label: string;
  href: string;
  iconName: "folder-heart" | "shopping-bag" | "user" | "badge-percent" | "settings";
};

type CustomerNavGroup = {
  label: string;
  iconName: "folder-heart" | "shopping-bag" | "user" | "badge-percent" | "settings";
  children: CustomerNavChild[];
  defaultOpen?: boolean;
};

export default async function CustomerLayout({ children, }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const accountLinks: CustomerNavChild[] = [
    { label: "Hồ sơ", href: ROUTES.CUSTOMER.PROFILE, iconName: "user" },
    { label: "Tiếp thị liên kết", href: ROUTES.CUSTOMER.AFFILIATE, iconName: "badge-percent" },
  ];

  const customerNavGroups: CustomerNavGroup[] = [
    {
      label: "Đơn hàng",
      iconName: "shopping-bag",
      defaultOpen: false,
      children: [{ label: "Đơn hàng của tôi", href: ROUTES.CUSTOMER.ORDERS, iconName: "shopping-bag" }],
    },
    {
      label: "Thiệp",
      iconName: "folder-heart",
      defaultOpen: false,
      children: [{ label: "Thiệp của tôi", href: ROUTES.CUSTOMER.INVITATIONS, iconName: "folder-heart" }],
    },
    {
      label: "Tài khoản",
      iconName: "user",
      defaultOpen: false,
      children: accountLinks,
    },
    {
      label: "Hệ thống",
      iconName: "settings",
      defaultOpen: false,
      children: [{ label: "Cài đặt", href: ROUTES.CUSTOMER.SETTINGS, iconName: "settings" }],
    },
  ];

  return (
    <div className="min-h-screen md:grid md:grid-cols-12">
      <aside className="admin-sidebar-scroll hidden overflow-y-auto border-r bg-background p-5 md:sticky md:top-0 md:col-span-2 md:flex md:h-screen md:flex-col md:gap-3">
        <div className="flex items-center gap-2 mb-6 px-3">
          <div className="h-6 w-6 rounded-bg bg-primary" />
          <h2 className="text-lg font-bold tracking-tight">PinkLove</h2>
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

          <div className="mt-auto pt-4 border-t">
            <Link href={ROUTES.HOME} className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted">
              <ExternalLink className="h-5 w-5" />
              Xem Website
            </Link>
          </div>
        </nav>
      </aside>

      <main className="min-h-screen bg-muted/30 bg-[#f9f9f9] md:col-span-10">
        <CustomerTopHeader username={user.username} />

        <section className="min-h-screen">
          <section className="md:hidden border-b bg-background px-4 py-2">
            <nav className="flex gap-4 overflow-x-auto py-1">
              <CustomerNavLink href={ROUTES.CUSTOMER.DASHBOARD} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </CustomerNavLink>
              <CustomerNavLink href={ROUTES.CUSTOMER.INVITATIONS} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">
                <FolderHeart className="h-4 w-4" />
                Thiệp của tôi
              </CustomerNavLink>
              <CustomerNavLink href={ROUTES.CUSTOMER.ORDERS} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">
                <ShoppingBag className="h-4 w-4" />
                Đơn hàng
              </CustomerNavLink>
              <CustomerNavLink href={ROUTES.CUSTOMER.PROFILE} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">
                <UserIcon className="h-4 w-4" />
                Hồ sơ
              </CustomerNavLink>
              <CustomerNavLink href={ROUTES.CUSTOMER.AFFILIATE} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">
                <BadgePercent className="h-4 w-4" />
                Affiliate
              </CustomerNavLink>
              {isVendorRole(user.role) ? (
                <CustomerNavLink href={ROUTES.CUSTOMER.VENDOR} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">
                  <Store className="h-4 w-4" />
                  Vendor
                </CustomerNavLink>
              ) : null}
              <CustomerNavLink href={ROUTES.CUSTOMER.SETTINGS} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">
                <Settings className="h-4 w-4" />
                Cài đặt
              </CustomerNavLink>
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
