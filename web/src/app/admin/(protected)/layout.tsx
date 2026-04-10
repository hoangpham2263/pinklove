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
  BookOpenText
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
    label: "User",
    iconName: "users",
    defaultOpen: false,
    children: [
      { label: "Users", href: ROUTES.ADMIN.USERS, iconName: "users" },
      { label: "Affiliate", href: ROUTES.ADMIN.AFFILIATES, iconName: "badge-percent" },
    ],
  },
];

export default async function AdminLayout({
  children
}: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div>
      <aside className="admin-sidebar-scroll fixed top-0 left-0 hidden h-screen w-60 overflow-y-auto border-r bg-background p-5 md:flex md:flex-col md:gap-3">
        <div className="flex items-center gap-2 mb-6 px-3">
          <div className="h-6 w-6 rounded-bg bg-primary" />
          <h2 className="text-lg font-bold tracking-tight">PinkLove</h2>
        </div>

        <nav className="flex flex-col gap-2.5">
          <AdminNavLink href={ROUTES.ADMIN.DASHBOARD} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors">
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </AdminNavLink>

          <AdminNavLink href={ROUTES.ADMIN.MEDIA} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors">
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

          <AdminNavLink href={ROUTES.ADMIN.CONFIG} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors">
            <Settings className="h-5 w-5" />
            <span>Cấu hình</span>
          </AdminNavLink>



          <div className="mt-auto pt-4 border-t">

            <Link href={ROUTES.HOME} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted">

              <ExternalLink className="h-5 w-5" />

              Xem Website

            </Link>

          </div>

        </nav>

      </aside>



      <main className="md:ml-60 min-h-screen bg-muted/30">



        <AdminTopHeader username={user.username} />



        <section className="min-h-screen pt-14">

          <section className="md:hidden border-b bg-background px-4 py-2">

            <nav className="flex gap-4 overflow-x-auto py-1">

              <AdminNavLink href={ROUTES.ADMIN.DASHBOARD} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-sm transition-colors">

                <LayoutDashboard className="h-4 w-4" />

                Dashboard

              </AdminNavLink>



              <div className="w-px shrink-0 bg-border my-1" />



              <AdminNavLink href={ROUTES.ADMIN.PAGES} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-sm transition-colors">

                <Files className="h-4 w-4" />

                Pages

              </AdminNavLink>

              <AdminNavLink href={ROUTES.ADMIN.BLOG_POSTS} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-sm transition-colors">

                <Files className="h-4 w-4" />

                Blog Posts

              </AdminNavLink>

              <AdminNavLink href={ROUTES.ADMIN.BLOG_CATEGORIES} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-sm transition-colors">

                <Files className="h-4 w-4" />

                Blog Categories

              </AdminNavLink>

              <AdminNavLink href={ROUTES.ADMIN.PRODUCT_LIST} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-sm transition-colors">

                <ShoppingBag className="h-4 w-4" />

                Product List

              </AdminNavLink>

              <AdminNavLink href={ROUTES.ADMIN.PRODUCT_CATEGORIES} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-sm transition-colors">

                <ShoppingBag className="h-4 w-4" />

                Product Categories

              </AdminNavLink>

              <AdminNavLink href={ROUTES.ADMIN.MENUS} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-sm transition-colors">

                <MenuIcon className="h-4 w-4" />

                Navigation

              </AdminNavLink>

              <AdminNavLink href={ROUTES.ADMIN.MEDIA} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-sm transition-colors">

                <ImageIcon className="h-4 w-4" />

                Media

              </AdminNavLink>

              <div className="w-px shrink-0 bg-border my-1" />



              <AdminNavLink href={ROUTES.ADMIN.USERS} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-sm transition-colors">

                <Users className="h-4 w-4" />

                Users

              </AdminNavLink>

              <AdminNavLink href={ROUTES.ADMIN.AFFILIATES} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-sm transition-colors">

                <BadgePercent className="h-4 w-4" />

                Affiliate

              </AdminNavLink>

              <AdminNavLink href={ROUTES.ADMIN.CONFIG} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-sm transition-colors">

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
