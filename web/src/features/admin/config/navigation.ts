import { ROUTES } from "@/lib/routes";

export type AdminNavIconName =
  | "files"
  | "file-code-2"
  | "blocks"
  | "package"
  | "tags"
  | "receipt-text"
  | "credit-card"
  | "truck"
  | "shopping-bag"
  | "menu"
  | "message-circle"
  | "messages-square"
  | "image"
  | "book-open-text"
  | "list-tree"
  | "bell"
  | "users"
  | "store"
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
  iconName: AdminNavIconName | "layout-dashboard" | "external-link" | "message-circle";
};

export const ADMIN_NAV_PRIMARY_ITEMS: AdminStandaloneNavItem[] = [
  { label: "Dashboard", href: ROUTES.ADMIN.DASHBOARD, iconName: "layout-dashboard" },
  { label: "Messages", href: ROUTES.ADMIN.MESSAGES, iconName: "message-circle" },
  { label: "Comments", href: ROUTES.ADMIN.COMMENTS, iconName: "messages-square" },
  { label: "Media", href: ROUTES.ADMIN.MEDIA, iconName: "image" },
];

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Content",
    iconName: "files",
    defaultOpen: false,
    children: [
      { label: "Pages", href: ROUTES.ADMIN.PAGES, iconName: "files" },
      { label: "Navigation", href: ROUTES.ADMIN.MENUS, iconName: "menu" },
      { label: "Blog Posts", href: ROUTES.ADMIN.BLOG, iconName: "book-open-text" },
      { label: "Blog Categories", href: ROUTES.ADMIN.BLOG_CATEGORIES, iconName: "tags" },
    ],
  },
  {
    label: "Products",
    iconName: "package",
    defaultOpen: false,
    children: [
      { label: "Product List", href: ROUTES.ADMIN.PRODUCT_LIST, iconName: "package" },
      { label: "Product Categories", href: ROUTES.ADMIN.PRODUCT_CATEGORIES, iconName: "tags" },
      { label: "Coded Templates", href: ROUTES.ADMIN.CODED_TEMPLATES, iconName: "file-code-2" },
      { label: "Builder", href: ROUTES.ADMIN.BUILDER, iconName: "blocks" },
      { label: "Vendor Review", href: ROUTES.ADMIN.VENDOR_PRODUCTS, iconName: "package" },
    ],
  },
  {
    label: "Sales",
    iconName: "shopping-bag",
    defaultOpen: false,
    children: [
      { label: "Customers", href: ROUTES.ADMIN.CUSTOMERS, iconName: "users" },
      { label: "Orders", href: ROUTES.ADMIN.ORDERS, iconName: "receipt-text" },
      { label: "Payments", href: ROUTES.ADMIN.PAYMENTS, iconName: "credit-card" },
      { label: "Shipments", href: ROUTES.ADMIN.SHIPMENTS, iconName: "truck" },
    ],
  },
  {
    label: "Partners",
    iconName: "store",
    defaultOpen: false,
    children: [
      { label: "Vendors", href: ROUTES.ADMIN.VENDORS, iconName: "store" },
      { label: "Affiliate Users", href: ROUTES.ADMIN.AFFILIATE_USERS, iconName: "users" },
      { label: "Affiliate Programs", href: ROUTES.ADMIN.AFFILIATES, iconName: "badge-percent" },
    ],
  },
  {
    label: "Accounts",
    iconName: "users",
    defaultOpen: false,
    children: [
      { label: "Users", href: ROUTES.ADMIN.USERS, iconName: "users" },
      { label: "Internal Accounts", href: ROUTES.ADMIN.INTERNAL_ACCOUNTS, iconName: "users" },
    ],
  },
];

export const ADMIN_NAV_SECONDARY_ITEMS: AdminStandaloneNavItem[] = [
  { label: "Global Fields", href: ROUTES.ADMIN.GLOBAL_FIELDS, iconName: "list-tree" },
  { label: "Configuration", href: ROUTES.ADMIN.CONFIG, iconName: "settings" },
];

export const ADMIN_NAV_AUXILIARY_ITEMS: AdminStandaloneNavItem[] = [
  { label: "View Website", href: ROUTES.HOME, iconName: "external-link" },
];
