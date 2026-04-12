import { ROUTES } from "@/lib/routes";

export type AdminNavIconName =
  | "files"
  | "shopping-bag"
  | "menu"
  | "image"
  | "book-open-text"
  | "users"
  | "badge-percent"
  | "settings";

export type AdminNavChild = {
  label: string;
  href: string;
  iconName: AdminNavIconName;
};

export type AdminNavGroup = {
  label: string;
  iconName: AdminNavIconName;
  children: AdminNavChild[];
  defaultOpen?: boolean;
};

export type AdminStandaloneNavItem = {
  label: string;
  href: string;
  iconName: AdminNavIconName | "layout-dashboard" | "external-link";
};

export const ADMIN_NAV_PRIMARY_ITEMS: AdminStandaloneNavItem[] = [
  { label: "Dashboard", href: ROUTES.ADMIN.DASHBOARD, iconName: "layout-dashboard" },
  { label: "Media", href: ROUTES.ADMIN.MEDIA, iconName: "image" },
];

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
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
    label: "Ecommerce",
    iconName: "shopping-bag",
    defaultOpen: false,
    children: [
      { label: "Product", href: ROUTES.ADMIN.PRODUCT_LIST, iconName: "shopping-bag" },
      { label: "Product Cat", href: ROUTES.ADMIN.PRODUCT_CATEGORIES, iconName: "shopping-bag" },
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
    children: [{ label: "Nhà cung cấp", href: ROUTES.ADMIN.VENDORS, iconName: "users" }],
  },
];

export const ADMIN_NAV_SECONDARY_ITEMS: AdminStandaloneNavItem[] = [
  { label: "Global Fields", href: ROUTES.ADMIN.GLOBAL_FIELDS, iconName: "book-open-text" },
  { label: "Cấu hình", href: ROUTES.ADMIN.CONFIG, iconName: "settings" },
];

export const ADMIN_NAV_AUXILIARY_ITEMS: AdminStandaloneNavItem[] = [
  { label: "Xem Website", href: ROUTES.HOME, iconName: "external-link" },
];
