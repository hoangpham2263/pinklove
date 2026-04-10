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

export type AdminMobileNavEntry =
  | { type: "link"; label: string; href: string; iconName: AdminNavIconName | "layout-dashboard" | "external-link" }
  | { type: "separator" };

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

export const ADMIN_MOBILE_NAV: AdminMobileNavEntry[] = [
  { type: "link", label: "Dashboard", href: ROUTES.ADMIN.DASHBOARD, iconName: "layout-dashboard" },
  { type: "separator" },
  { type: "link", label: "Pages", href: ROUTES.ADMIN.PAGES, iconName: "files" },
  { type: "link", label: "Blog Posts", href: ROUTES.ADMIN.BLOG_POSTS, iconName: "files" },
  { type: "link", label: "Blog Categories", href: ROUTES.ADMIN.BLOG_CATEGORIES, iconName: "files" },
  { type: "link", label: "Product", href: ROUTES.ADMIN.PRODUCT_LIST, iconName: "shopping-bag" },
  { type: "link", label: "Product Cat", href: ROUTES.ADMIN.PRODUCT_CATEGORIES, iconName: "shopping-bag" },
  { type: "link", label: "Orders", href: ROUTES.ADMIN.ORDERS, iconName: "shopping-bag" },
  { type: "link", label: "Payments", href: ROUTES.ADMIN.PAYMENTS, iconName: "shopping-bag" },
  { type: "link", label: "Shipments", href: ROUTES.ADMIN.SHIPMENTS, iconName: "shopping-bag" },
  { type: "link", label: "Navigation", href: ROUTES.ADMIN.MENUS, iconName: "menu" },
  { type: "link", label: "Media", href: ROUTES.ADMIN.MEDIA, iconName: "image" },
  { type: "separator" },
  { type: "link", label: "Người dùng", href: ROUTES.ADMIN.USERS, iconName: "users" },
  { type: "link", label: "Khách hàng", href: ROUTES.ADMIN.CUSTOMERS, iconName: "users" },
  { type: "link", label: "Tài khoản nội bộ", href: ROUTES.ADMIN.INTERNAL_ACCOUNTS, iconName: "users" },
  { type: "separator" },
  { type: "link", label: "Đối tác / CTV", href: ROUTES.ADMIN.AFFILIATE_USERS, iconName: "users" },
  { type: "link", label: "Chương trình affiliate", href: ROUTES.ADMIN.AFFILIATES, iconName: "badge-percent" },
  { type: "separator" },
  { type: "link", label: "Nhà cung cấp", href: ROUTES.ADMIN.VENDORS, iconName: "users" },
  { type: "link", label: "Global Fields", href: ROUTES.ADMIN.GLOBAL_FIELDS, iconName: "book-open-text" },
  { type: "link", label: "Cấu hình", href: ROUTES.ADMIN.CONFIG, iconName: "settings" },
];
