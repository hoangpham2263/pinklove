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
      { label: "Pages", href: "/admin/pages", iconName: "files" },
      { label: "Navigation", href: "/admin/menus", iconName: "menu" },
    ],
  },
  {
    label: "Product",
    iconName: "shopping-bag",
    defaultOpen: false,
    children: [
      { label: "Product List", href: ROUTES.ADMIN.PRODUCT_LIST, iconName: "shopping-bag" },
      { label: "Create Product", href: ROUTES.ADMIN.PRODUCTS, iconName: "shopping-bag" },
    ],
  },
  {
    label: "User",
    iconName: "users",
    defaultOpen: false,
    children: [
      { label: "Users", href: "/admin/user", iconName: "users" },
      { label: "Affiliate", href: ROUTES.ADMIN.AFFILIATES, iconName: "badge-percent" },
    ],
  },
  {
    label: "Seo",
    iconName: "book-open-text",
    defaultOpen: false,
    children: [
      { label: "Page Seo", href: `${ROUTES.ADMIN.SEO_GUIDE}#page-seo`, iconName: "book-open-text" },
      { label: "Seo Content", href: `${ROUTES.ADMIN.SEO_GUIDE}#seo-content`, iconName: "book-open-text" },
      { label: "Seo Robots", href: `${ROUTES.ADMIN.SEO_GUIDE}#seo-robots`, iconName: "book-open-text" },
    ],
  },
  {
    label: "System",
    iconName: "settings",
    defaultOpen: false,
    children: [
      { label: "Settings", href: "/admin/settings", iconName: "settings" },
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
          <Link href={ROUTES.ADMIN.DASHBOARD} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted">
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>

          <Link href={ROUTES.ADMIN.MEDIA} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted">
            <ImageIcon className="h-5 w-5" />
            <span>Media</span>
          </Link>

          {adminNavGroups.map((group) => (
            <AdminSidebarGroup
              key={group.label}
              label={group.label}
              iconName={group.iconName}
              children={group.children}
              defaultOpen={group.defaultOpen}
            />
          ))}



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

              <Link href={ROUTES.ADMIN.DASHBOARD} className="flex items-center gap-1.5 whitespace-nowrap">

                <LayoutDashboard className="h-4 w-4" />

                Dashboard

              </Link>



              <div className="w-px shrink-0 bg-border my-1" />



              <Link href={ROUTES.ADMIN.PAGES} className="flex items-center gap-1.5 whitespace-nowrap">

                <Files className="h-4 w-4" />

                Pages

              </Link>

              <Link href={ROUTES.ADMIN.PRODUCTS} className="flex items-center gap-1.5 whitespace-nowrap">

                <ShoppingBag className="h-4 w-4" />

                Products

              </Link>

              <Link href={ROUTES.ADMIN.MENUS} className="flex items-center gap-1.5 whitespace-nowrap">

                <MenuIcon className="h-4 w-4" />

                Navigation

              </Link>

              <Link href={ROUTES.ADMIN.MEDIA} className="flex items-center gap-1.5 whitespace-nowrap">

                <ImageIcon className="h-4 w-4" />

                Media

              </Link>

              <Link href={ROUTES.ADMIN.SEO_GUIDE} className="flex items-center gap-1.5 whitespace-nowrap">

                <BookOpenText className="h-4 w-4" />

                Seo Guide

              </Link>



              <div className="w-px shrink-0 bg-border my-1" />



              <Link href={ROUTES.ADMIN.USER} className="flex items-center gap-1.5 whitespace-nowrap">

                <Users className="h-4 w-4" />

                Users

              </Link>

              <Link href={ROUTES.ADMIN.AFFILIATES} className="flex items-center gap-1.5 whitespace-nowrap">

                <BadgePercent className="h-4 w-4" />

                Affiliate

              </Link>

              <Link href={ROUTES.ADMIN.SETTINGS} className="flex items-center gap-1.5 whitespace-nowrap">

                <Settings className="h-4 w-4" />

                Settings

              </Link>

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
