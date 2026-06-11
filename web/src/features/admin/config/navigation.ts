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
  permission?: string;
};

export type AdminNavGroup = {
  label: string;
  iconName: AdminNavIconName;
  children: AdminNavChild[];
  defaultOpen?: boolean;
  permission?: string;
};

export type AdminStandaloneNavItem = {
  label: string;
  href: string;
  iconName: AdminNavIconName | "layout-dashboard" | "external-link" | "message-circle";
  exact?: boolean;
  matchPrefixes?: string[];
  excludePaths?: string[];
  excludePrefixes?: string[];
  permission?: string;
};

const adminOfferingDetailPrefix = ROUTES.ADMIN.OFFERING("").slice(0, -1);

export const ADMIN_NAV_PRIMARY_ITEMS: AdminStandaloneNavItem[] = [
  { label: "Dashboard", href: ROUTES.ADMIN.DASHBOARD, iconName: "layout-dashboard", permission: "dashboard.view" },
  { label: "Messages", href: ROUTES.ADMIN.MESSAGES, iconName: "message-circle", permission: "messages.view" },
  { label: "Comments", href: ROUTES.ADMIN.COMMENTS, iconName: "messages-square", permission: "comments.view" },
];

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Content",
    permission: "content.view",
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
    label: "Commerce",
    permission: "commerce.view",
    iconName: "shopping-bag",
    defaultOpen: false,
    children: [
      { label: "Orders", href: ROUTES.ADMIN.ORDERS, iconName: "receipt-text" },
      { label: "Payments", href: ROUTES.ADMIN.PAYMENTS, iconName: "credit-card" },
      { label: "Shipments", href: ROUTES.ADMIN.SHIPMENTS, iconName: "truck" },
    ],
  },
  {
    label: "Marketplace",
    permission: "marketplace.view",
    iconName: "store",
    defaultOpen: false,
    children: [
      { label: "Providers", href: ROUTES.ADMIN.PROVIDERS, iconName: "briefcase-business", exact: true },
      { label: "Provider Accounts", href: ROUTES.ADMIN.PROVIDER_ACCOUNTS, iconName: "store" },
      { label: "Leads & Quotes", href: ROUTES.ADMIN.PROVIDER_LEADS, iconName: "messages-square", exact: true },
      { label: "Reviews", href: ROUTES.ADMIN.PROVIDER_REVIEWS, iconName: "messages-square" },
      { label: "Provider Availability", href: ROUTES.ADMIN.PROVIDER_AVAILABILITY, iconName: "calendar-clock", exact: true },
      { label: "Dịch vụ/sản phẩm cần provider", href: ROUTES.ADMIN.PROVIDER_SOURCING_OFFERINGS, iconName: "package", exact: true },
      { label: "Yêu cầu supplier", href: ROUTES.ADMIN.PROVIDER_SOURCING_REQUESTS, iconName: "truck", exact: true },
      { label: "Supplier đã duyệt", href: ROUTES.ADMIN.PROVIDER_SOURCING_SUPPLIERS, iconName: "store", exact: true },
      { label: "Duyệt yêu cầu dịch vụ/sản phẩm", href: ROUTES.ADMIN.PROVIDER_OFFERINGS, iconName: "package" },
    ],
  },
  {
    label: "Booking",
    permission: "bookings.view",
    iconName: "calendar-clock",
    defaultOpen: false,
    children: [
      { label: "Bookings", href: ROUTES.ADMIN.BOOKINGS, iconName: "calendar-clock" },
    ],
  },
  {
    label: "Marketing",
    permission: "marketing.view",
    iconName: "badge-percent",
    defaultOpen: false,
    children: [
      { label: "Landing Pages", href: ROUTES.ADMIN.LANDING_PAGES, iconName: "blocks" },
      { label: "Campaigns", href: ROUTES.ADMIN.MARKETING_CAMPAIGNS, iconName: "badge-percent" },
      { label: "A/B Tests", href: ROUTES.ADMIN.AB_EXPERIMENTS, iconName: "search" },
    ],
  },
  {
    label: "Planning",
    permission: "planning.view",
    iconName: "calendar-clock",
    defaultOpen: false,
    children: [
      { label: "Wedding Planning", href: ROUTES.ADMIN.WEDDING_PLANNING, iconName: "calendar-clock" },
    ],
  },
  {
    label: "Offerings",
    permission: "offerings.view",
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
      { label: "Offering Types", href: ROUTES.ADMIN.OFFERING_TYPES, iconName: "list-tree" },
      { label: "Offering Templates", href: ROUTES.ADMIN.OFFERING_TEMPLATES, iconName: "file-code-2" },
      { label: "Offering Builder", href: ROUTES.ADMIN.OFFERING_BUILDER, iconName: "blocks" },
      { label: "Offering Categories", href: ROUTES.ADMIN.OFFERING_CATEGORIES, iconName: "tags" },
      { label: "Combo dịch vụ", href: ROUTES.ADMIN.OFFERING_BUNDLES, iconName: "boxes" },
    ],
  },
  {
    label: "Affiliate Marketing",
    permission: "affiliates.view",
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
    permission: "accounts.view",
    iconName: "users",
    defaultOpen: false,
    children: [
      { label: "Users", href: ROUTES.ADMIN.USERS, iconName: "users", permission: "accounts.manage" },
      { label: "Customers", href: ROUTES.ADMIN.CUSTOMERS, iconName: "users" },
      { label: "Internal Accounts", href: ROUTES.ADMIN.INTERNAL_ACCOUNTS, iconName: "users" },
      { label: "Access Roles", href: ROUTES.ADMIN.ACCESS_ROLES, iconName: "settings", permission: "accounts.manage" },
    ],
  },
  {
    label: "System",
    permission: "system.view",
    iconName: "settings",
    defaultOpen: false,
    children: [
      { label: "Audit Logs", href: ROUTES.ADMIN.AUDIT_LOGS, iconName: "radio" },
      { label: "Global Fields", href: ROUTES.ADMIN.GLOBAL_FIELDS, iconName: "list-tree" },
      { label: "Media Library", href: ROUTES.ADMIN.MEDIA_LIBRARY, iconName: "image" },
      { label: "Media Collections", href: ROUTES.ADMIN.MEDIA_COLLECTIONS, iconName: "image" },
      { label: "Analytics Goals", href: ROUTES.ADMIN.ANALYTICS_GOALS, iconName: "chart-no-axes-combined" },
    ],
  },
];

export const ADMIN_NAV_SECONDARY_ITEMS: AdminStandaloneNavItem[] = [
  { label: "Analytics", href: ROUTES.ADMIN.ANALYTICS, iconName: "chart-no-axes-combined", permission: "analytics.view" },
  { label: "Domain Events", href: ROUTES.ADMIN.DOMAIN_EVENTS, iconName: "radio", permission: "system.view" },
  { label: "Configuration", href: ROUTES.ADMIN.CONFIG, iconName: "settings", permission: "configuration.view" },
];

export const ADMIN_NAV_AUXILIARY_ITEMS: AdminStandaloneNavItem[] = [
  { label: "View Website", href: ROUTES.HOME, iconName: "external-link" },
];
