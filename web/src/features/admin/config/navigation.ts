import { ROUTES } from "@/lib/routes";

export type AdminNavIconName =
  | "files"
  | "file-code-2"
  | "blocks"
  | "boxes"
  | "briefcase-business"
  | "calendar-clock"
  | "chart-no-axes-combined"
  | "package"
  | "radio"
  | "search"
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
    label: "Offerings",
    iconName: "package",
    defaultOpen: false,
    children: [
      { label: "Overview", href: ROUTES.ADMIN.OFFERING_LIST, iconName: "package" },
      { label: "Offering", href: ROUTES.ADMIN.OFFERING_MANAGE, iconName: "package" },
      { label: "Offering Types", href: ROUTES.ADMIN.OFFERING_TYPES, iconName: "list-tree" },
      { label: "Offering Templates", href: ROUTES.ADMIN.OFFERING_TEMPLATES, iconName: "file-code-2" },
      { label: "Offering Builder", href: ROUTES.ADMIN.OFFERING_BUILDER, iconName: "blocks" },
      { label: "Offering Categories", href: ROUTES.ADMIN.OFFERING_CATEGORIES, iconName: "tags" },
      { label: "Bundles", href: ROUTES.ADMIN.OFFERING_BUNDLES, iconName: "boxes" },
      { label: "Search Documents", href: ROUTES.ADMIN.OFFERING_SEARCH_DOCUMENTS, iconName: "search" },
      { label: "Template Attributes", href: ROUTES.ADMIN.TEMPLATE_ATTRIBUTES, iconName: "tags" },
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
    label: "Vendors",
    iconName: "store",
    defaultOpen: false,
    children: [
      { label: "Vendor Accounts", href: ROUTES.ADMIN.VENDORS, iconName: "store" },
      { label: "Providers", href: ROUTES.ADMIN.PROVIDERS, iconName: "briefcase-business" },
      { label: "Availability", href: ROUTES.ADMIN.PROVIDER_AVAILABILITY, iconName: "calendar-clock" },
      { label: "Vendor Offering Review", href: ROUTES.ADMIN.VENDOR_OFFERINGS, iconName: "package" },
    ],
  },
  {
    label: "Affiliate Marketing",
    iconName: "badge-percent",
    defaultOpen: false,
    children: [
      { label: "Affiliate Overview", href: ROUTES.ADMIN.AFFILIATES, iconName: "badge-percent" },
      { label: "Affiliate Users", href: ROUTES.ADMIN.AFFILIATE_USERS, iconName: "users" },
      { label: "Hồ sơ Guest Affiliate", href: ROUTES.ADMIN.AFFILIATE_APPLICATIONS, iconName: "users" },
      { label: "Hoa hồng Affiliate", href: ROUTES.ADMIN.AFFILIATE_CONVERSIONS, iconName: "badge-percent" },
      { label: "Duyệt Customer Affiliate", href: ROUTES.ADMIN.AFFILIATE_ACCOUNTS, iconName: "badge-percent" },
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
  { label: "Analytics", href: ROUTES.ADMIN.ANALYTICS, iconName: "chart-no-axes-combined" },
  { label: "Domain Events", href: ROUTES.ADMIN.DOMAIN_EVENTS, iconName: "radio" },
  { label: "Configuration", href: ROUTES.ADMIN.CONFIG, iconName: "settings" },
];

export const ADMIN_NAV_AUXILIARY_ITEMS: AdminStandaloneNavItem[] = [
  { label: "View Website", href: ROUTES.HOME, iconName: "external-link" },
];
