import Link from "next/link";
import {
  LayoutDashboard,
  Files,
  Menu as MenuIcon,
  Image as ImageIcon,
  ShoppingBag,
  Users,
  BadgePercent,
  Settings,
  ExternalLink,
} from "lucide-react";

import { AdminTopHeader } from "@/features/admin/components/layout/admin-top-header";
import { AdminNavLink } from "@/features/admin/components/layout/admin-nav-link";
import { AdminSidebarGroup } from "@/features/admin/components/layout/admin-sidebar-group";

import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

type AdminNavChild = {
  label: string;
  href: string;
  iconName: "files" | "shopping-bag" | "menu" | "image" | "book-open-text" | "users" | "badge-percent" | "settings";
};

type AdminNavGroup = {
  label: string;
  iconName: "files" | "shopping-bag" | "menu" | "image" | "book-open-text" | "users" | "badge-percent" | "settings";
  children: AdminNavChild[];
  defaultOpen?: boolean;
};

const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Page",
    iconName: "files",
    defaultOpen: false,
    children: [
      { label: "Pages", href: ROUTES.ADMIN.PAGES, iconName: "files" },
      { label: "Navigation", href: ROUTES.ADMIN.MENUS, iconName: "menu" },
    ],
  },
  {
    label: "Blog",
    iconName: "files",
    defaultOpen: false,
    children: [
      { label: "Blog Posts", href: ROUTES.ADMIN.BLOG_POSTS, iconName: "files" },
      { label: "Blog Categories", href: ROUTES.ADMIN.BLOG_CATEGORIES, iconName: "files" },
    ],
  },
  {
    label: "Product",
    iconName: "shopping-bag",
    defaultOpen: false,
    children: [
      { label: "Product List", href: ROUTES.ADMIN.PRODUCT_LIST, iconName: "shopping-bag" },
      { label: "Product Categories", href: ROUTES.ADMIN.PRODUCT_CATEGORIES, iconName: "shopping-bag" },
    ],
  },
  {
    label: "Commerce",
    iconName: "shopping-bag",
    defaultOpen: false,
    children: [
      { label: "Orders", href: ROUTES.ADMIN.ORDERS, iconName: "shopping-bag" },
      { label: "Payments", href: ROUTES.ADMIN.PAYMENTS, iconName: "shopping-bag" },
      { label: "Shipments", href: ROUTES.ADMIN.SHIPMENTS, iconName: "shopping-bag" },
    ],
  },
  {
    label: "Tài khoản",
    iconName: "users",
    defaultOpen: false,
    children: [
      { label: "Người dùng", href: ROUTES.ADMIN.USERS, iconName: "users" },
      { label: "Khách hàng", href: ROUTES.ADMIN.CUSTOMERS, iconName: "users" },
      { label: "Tài khoản nội bộ", href: ROUTES.ADMIN.INTERNAL_ACCOUNTS, iconName: "users" },
    ],
  },
  {
    label: "Affiliate",
    iconName: "badge-percent",
    defaultOpen: false,
    children: [
      { label: "Đối tác / CTV", href: ROUTES.ADMIN.AFFILIATE_USERS, iconName: "users" },
      { label: "Chương trình affiliate", href: ROUTES.ADMIN.AFFILIATES, iconName: "badge-percent" },
    ],
  },
  {
    label: "Vendor",
    iconName: "users",
    defaultOpen: false,
    children: [
      { label: "Nhà cung cấp", href: ROUTES.ADMIN.VENDORS, iconName: "users" },
    ],
  },
];

export default async function AdminLayout({
  children
}: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen md:grid md:grid-cols-12">
      <aside className="admin-sidebar-scroll hidden border-r bg-background p-5 md:sticky md:top-0 md:col-span-2 md:flex md:h-screen md:flex-col md:gap-3">
        <div className="flex items-center gap-2 mb-6 px-3">
          <div className="h-6 w-6 rounded-bg bg-primary" />
          <h2 className="text-lg font-bold tracking-tight">PinkLove</h2>
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

          {adminNavGroups.map((group) => (
            <AdminSidebarGroup
              key={group.label}
              label={group.label}
              iconName={group.iconName}
              items={group.children}
              defaultOpen={group.defaultOpen}
            />
          ))}

          <AdminNavLink href={ROUTES.ADMIN.CONFIG} className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors">
            <Settings className="h-5 w-5" />
            <span>Cấu hình</span>
          </AdminNavLink>



          <div className="mt-auto pt-4 border-t">

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

          <section className="md:hidden border-b bg-background px-4 py-2">

            <nav className="flex gap-4 overflow-x-auto py-1">

              <AdminNavLink href={ROUTES.ADMIN.DASHBOARD} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">

                <LayoutDashboard className="h-4 w-4" />

                Dashboard

              </AdminNavLink>



              <div className="w-px shrink-0 bg-border my-1" />



              <AdminNavLink href={ROUTES.ADMIN.PAGES} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">

                <Files className="h-4 w-4" />

                Pages

              </AdminNavLink>

              <AdminNavLink href={ROUTES.ADMIN.BLOG_POSTS} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">

                <Files className="h-4 w-4" />

                Blog Posts

              </AdminNavLink>

              <AdminNavLink href={ROUTES.ADMIN.BLOG_CATEGORIES} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">

                <Files className="h-4 w-4" />

                Blog Categories

              </AdminNavLink>

              <AdminNavLink href={ROUTES.ADMIN.PRODUCT_LIST} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">

                <ShoppingBag className="h-4 w-4" />

                Product List

              </AdminNavLink>

              <AdminNavLink href={ROUTES.ADMIN.PRODUCT_CATEGORIES} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">

                <ShoppingBag className="h-4 w-4" />

                Product Categories

              </AdminNavLink>

              <AdminNavLink href={ROUTES.ADMIN.ORDERS} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">

                <ShoppingBag className="h-4 w-4" />

                Orders

              </AdminNavLink>

              <AdminNavLink href={ROUTES.ADMIN.PAYMENTS} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">

                <ShoppingBag className="h-4 w-4" />

                Payments

              </AdminNavLink>

              <AdminNavLink href={ROUTES.ADMIN.SHIPMENTS} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">

                <ShoppingBag className="h-4 w-4" />

                Shipments

              </AdminNavLink>

              <AdminNavLink href={ROUTES.ADMIN.MENUS} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">

                <MenuIcon className="h-4 w-4" />

                Navigation

              </AdminNavLink>

              <AdminNavLink href={ROUTES.ADMIN.MEDIA} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">

                <ImageIcon className="h-4 w-4" />

                Media

              </AdminNavLink>

              <div className="w-px shrink-0 bg-border my-1" />



              <AdminNavLink href={ROUTES.ADMIN.USERS} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">

                <Users className="h-4 w-4" />

                Người dùng
              </AdminNavLink>

              <AdminNavLink href={ROUTES.ADMIN.CUSTOMERS} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">

                <Users className="h-4 w-4" />

                Khách hàng

              </AdminNavLink>

              <AdminNavLink href={ROUTES.ADMIN.INTERNAL_ACCOUNTS} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">

                <Users className="h-4 w-4" />

                Tài khoản nội bộ

              </AdminNavLink>

              <div className="w-px shrink-0 bg-border my-1" />

              <AdminNavLink href={ROUTES.ADMIN.AFFILIATE_USERS} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">

                <Users className="h-4 w-4" />

                Đối tác / CTV

              </AdminNavLink>

              <AdminNavLink href={ROUTES.ADMIN.AFFILIATES} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">

                <BadgePercent className="h-4 w-4" />

                Chương trình affiliate

              </AdminNavLink>

              <div className="w-px shrink-0 bg-border my-1" />

              <AdminNavLink href={ROUTES.ADMIN.VENDORS} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">

                <Users className="h-4 w-4" />

                Nhà cung cấp

              </AdminNavLink>

              <AdminNavLink href={ROUTES.ADMIN.CONFIG} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 transition-colors">

                <Settings className="h-4 w-4" />

                Cấu hình

              </AdminNavLink>

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
