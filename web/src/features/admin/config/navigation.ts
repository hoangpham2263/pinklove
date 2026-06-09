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
  exact?: boolean;
  matchPrefixes?: string[];
  excludePaths?: string[];
  excludePrefixes?: string[];
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
  exact?: boolean;
  matchPrefixes?: string[];
  excludePaths?: string[];
  excludePrefixes?: string[];
};

const adminOfferingDetailPrefix = ROUTES.ADMIN.OFFERING("").slice(0, -1);

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
      { label: "Overview", href: ROUTES.ADMIN.OFFERING_LIST, iconName: "package", exact: true },
      {
        label: "Offering",
        href: ROUTES.ADMIN.OFFERING_MANAGE,
        iconName: "package",
        matchPrefixes: [ROUTES.ADMIN.OFFERING_MANAGE, adminOfferingDetailPrefix],
        excludePaths: [ROUTES.ADMIN.OFFERING_LIST],
        excludePrefixes: [
          ROUTES.ADMIN.OFFERING_TEMPLATES,
          ROUTES.ADMIN.OFFERING_BUILDER,
          ROUTES.ADMIN.LANDING_PAGES,
          ROUTES.ADMIN.OFFERING_TYPES,
          ROUTES.ADMIN.OFFERING_CATEGORIES,
          ROUTES.ADMIN.OFFERING_BUNDLES,
        ],
      },
      { label: "Landing Pages", href: ROUTES.ADMIN.LANDING_PAGES, iconName: "blocks" },
      { label: "Offering Types", href: ROUTES.ADMIN.OFFERING_TYPES, iconName: "list-tree" },
      { label: "Offering Templates", href: ROUTES.ADMIN.OFFERING_TEMPLATES, iconName: "file-code-2" },
      { label: "Offering Builder", href: ROUTES.ADMIN.OFFERING_BUILDER, iconName: "blocks" },
      { label: "Offering Categories", href: ROUTES.ADMIN.OFFERING_CATEGORIES, iconName: "tags" },
      { label: "Combo dịch vụ", href: ROUTES.ADMIN.OFFERING_BUNDLES, iconName: "boxes" },
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
    label: "Nhà cung cấp",
    iconName: "store",
    defaultOpen: false,
    children: [
      { label: "Overview", href: ROUTES.ADMIN.PROVIDERS, iconName: "briefcase-business", exact: true },
      { label: "Tài khoản provider", href: ROUTES.ADMIN.PROVIDER_ACCOUNTS, iconName: "store" },
      { label: "Lịch provider", href: ROUTES.ADMIN.PROVIDER_AVAILABILITY, iconName: "calendar-clock", exact: true },
      { label: "Dịch vụ/sản phẩm cần provider", href: ROUTES.ADMIN.PROVIDER_SOURCING_OFFERINGS, iconName: "package", exact: true },
      { label: "Yêu cầu supplier", href: ROUTES.ADMIN.PROVIDER_SOURCING_REQUESTS, iconName: "truck", exact: true },
      { label: "Supplier đã duyệt", href: ROUTES.ADMIN.PROVIDER_SOURCING_SUPPLIERS, iconName: "store", exact: true },
      { label: "Duyệt yêu cầu dịch vụ/sản phẩm", href: ROUTES.ADMIN.PROVIDER_OFFERINGS, iconName: "package" },
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
