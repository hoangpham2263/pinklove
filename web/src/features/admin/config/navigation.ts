import { ROUTES } from "@/lib/routes";

export type AdminNavIconName =
  | "layout-dashboard"
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
  | "settings"
  | "external-link";

export type AdminFeatureItem = {
  key: string;
  title: string;
  description: string;
  href: string;
  iconName: AdminNavIconName;
  permission?: string;
};

export type AdminFeatureSection = {
  key: string;
  title: string;
  description: string;
  permissions?: string[];
  items: AdminFeatureItem[];
};

export type AdminFeatureDefinition = {
  key: string;
  label: string;
  description: string;
  href: string;
  iconName: AdminNavIconName;
  permissions?: string[];
  exact?: boolean;
  matchPrefixes?: string[];
  sections: AdminFeatureSection[];
};

const item = (
  key: string,
  title: string,
  description: string,
  href: string,
  iconName: AdminNavIconName,
  permission?: string,
): AdminFeatureItem => ({ key, title, description, href, iconName, permission });

export const ADMIN_FEATURES: AdminFeatureDefinition[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Tổng quan vận hành hệ thống.",
    href: ROUTES.ADMIN.DASHBOARD,
    iconName: "layout-dashboard",
    permissions: ["dashboard.view"],
    exact: true,
    sections: [],
  },
  {
    key: "commerce",
    label: "Commerce",
    description: "Quản lý catalog, bán hàng, booking và wedding planning.",
    href: ROUTES.ADMIN.COMMERCE,
    iconName: "shopping-bag",
    permissions: ["offerings.view", "commerce.view", "bookings.view", "planning.view"],
    matchPrefixes: [
      ROUTES.ADMIN.COMMERCE,
      ROUTES.ADMIN.OFFERING_LIST,
      ROUTES.ADMIN.ORDERS,
      ROUTES.ADMIN.PAYMENTS,
      ROUTES.ADMIN.SHIPMENTS,
      ROUTES.ADMIN.BOOKING,
      ROUTES.ADMIN.BOOKINGS,
      ROUTES.ADMIN.PLANNING,
      ROUTES.ADMIN.WEDDING_PLANNING,
    ],
    sections: [
      {
        key: "catalog",
        title: "Catalog & Offerings",
        description: "Sản phẩm, dịch vụ, template và cấu trúc catalog.",
        permissions: ["offerings.view"],
        items: [
          item("offering-list", "Quản lý sản phẩm", "Tìm kiếm, chỉnh sửa và cập nhật catalog.", ROUTES.ADMIN.OFFERING_MANAGE, "boxes"),
          item("offering-types", "Offering Types", "Quản lý schema từng loại offering.", ROUTES.ADMIN.OFFERING_TYPES, "list-tree"),
          item("offering-templates", "Offering Templates", "Quản lý kho coded template.", ROUTES.ADMIN.OFFERING_TEMPLATES, "file-code-2"),
          item("offering-builder", "Offering Builder", "Tạo và quản lý template bằng builder.", ROUTES.ADMIN.OFFERING_BUILDER, "blocks"),
          item("offering-categories", "Offering Categories", "Quản lý phân loại catalog.", ROUTES.ADMIN.OFFERING_CATEGORIES, "tags"),
          item("offering-bundles", "Combo dịch vụ", "Quản lý các gói kết hợp offering.", ROUTES.ADMIN.OFFERING_BUNDLES, "boxes"),
        ],
      },
      {
        key: "orders",
        title: "Đơn hàng & thanh toán",
        description: "Đơn hàng, giao dịch và vận chuyển.",
        permissions: ["commerce.view"],
        items: [
          item("orders", "Orders", "Theo dõi và xử lý đơn hàng.", ROUTES.ADMIN.ORDERS, "receipt-text"),
          item("payments", "Payments", "Theo dõi giao dịch thanh toán.", ROUTES.ADMIN.PAYMENTS, "credit-card"),
          item("shipments", "Shipments", "Quản lý giao hàng và vận chuyển.", ROUTES.ADMIN.SHIPMENTS, "truck"),
        ],
      },
      {
        key: "booking",
        title: "Booking",
        description: "Lịch đặt dịch vụ.",
        permissions: ["bookings.view"],
        items: [
          item("bookings", "Bookings", "Theo dõi và cập nhật lịch đặt dịch vụ.", ROUTES.ADMIN.BOOKINGS, "calendar-clock"),
        ],
      },
      {
        key: "planning",
        title: "Wedding Planning",
        description: "Kế hoạch cưới của khách hàng.",
        permissions: ["planning.view"],
        items: [
          item("wedding-planning", "Wedding Planning", "Theo dõi toàn bộ quy trình planning.", ROUTES.ADMIN.WEDDING_PLANNING, "calendar-clock"),
        ],
      },
    ],
  },
  {
    key: "marketplace",
    label: "Marketplace",
    description: "Quản lý provider, sourcing và chất lượng cung ứng.",
    href: ROUTES.ADMIN.PROVIDERS,
    iconName: "store",
    permissions: ["marketplace.view"],
    matchPrefixes: [ROUTES.ADMIN.PROVIDERS],
    sections: [
      {
        key: "providers",
        title: "Provider",
        description: "Tài khoản, lead, review và lịch khả dụng.",
        items: [
          item("provider-accounts", "Provider Accounts", "Quản lý tài khoản provider.", ROUTES.ADMIN.PROVIDER_ACCOUNTS, "users"),
          item("provider-leads", "Leads & Quotes", "Theo dõi lead và yêu cầu báo giá.", ROUTES.ADMIN.PROVIDER_LEADS, "messages-square"),
          item("provider-reviews", "Reviews", "Kiểm duyệt đánh giá provider.", ROUTES.ADMIN.PROVIDER_REVIEWS, "messages-square"),
          item("provider-availability", "Provider Availability", "Kiểm tra lịch khả dụng.", ROUTES.ADMIN.PROVIDER_AVAILABILITY, "calendar-clock"),
        ],
      },
      {
        key: "sourcing",
        title: "Sourcing & Supplier",
        description: "Đăng ký cung ứng và duyệt submission.",
        items: [
          item("sourcing-offerings", "Dịch vụ/sản phẩm cần provider", "Mở catalog cho provider đăng ký.", ROUTES.ADMIN.PROVIDER_SOURCING_OFFERINGS, "package"),
          item("sourcing-requests", "Yêu cầu supplier", "Duyệt yêu cầu tham gia cung ứng.", ROUTES.ADMIN.PROVIDER_SOURCING_REQUESTS, "truck"),
          item("sourcing-suppliers", "Supplier đã duyệt", "Quản lý supplier được chấp thuận.", ROUTES.ADMIN.PROVIDER_SOURCING_SUPPLIERS, "store"),
          item("provider-offerings", "Duyệt submission", "Duyệt offering provider gửi lên.", ROUTES.ADMIN.PROVIDER_OFFERINGS, "package"),
        ],
      },
    ],
  },
  {
    key: "accounts",
    label: "Accounts",
    description: "Quản lý người dùng, phân quyền và affiliate.",
    href: ROUTES.ADMIN.ACCOUNTS,
    iconName: "users",
    permissions: ["accounts.view", "affiliates.view"],
    matchPrefixes: [
      ROUTES.ADMIN.ACCOUNTS,
      ROUTES.ADMIN.USERS,
      ROUTES.ADMIN.CUSTOMERS,
      ROUTES.ADMIN.INTERNAL_ACCOUNTS,
      ROUTES.ADMIN.ACCESS_ROLES,
      ROUTES.ADMIN.AFFILIATES,
    ],
    sections: [
      {
        key: "accounts",
        title: "Tài khoản",
        description: "Người dùng, khách hàng, tài khoản nội bộ và quyền Admin.",
        permissions: ["accounts.view"],
        items: [
          item("users", "Users", "Quản lý toàn bộ tài khoản.", ROUTES.ADMIN.USERS, "users", "accounts.manage"),
          item("customers", "Customers", "Quản lý tài khoản khách hàng.", ROUTES.ADMIN.CUSTOMERS, "users"),
          item("internal-accounts", "Internal Accounts", "Quản lý kênh vận hành nội bộ.", ROUTES.ADMIN.INTERNAL_ACCOUNTS, "users"),
          item("access-roles", "Access Roles", "Quản lý vai trò và quyền Admin.", ROUTES.ADMIN.ACCESS_ROLES, "settings", "accounts.manage"),
        ],
      },
      {
        key: "affiliate",
        title: "Affiliate",
        description: "Tài khoản, hồ sơ và hoa hồng affiliate.",
        permissions: ["affiliates.view"],
        items: [
          item("affiliate-users", "Affiliate Users", "Quản lý đối tác và cộng tác viên.", ROUTES.ADMIN.AFFILIATE_USERS, "users"),
          item("affiliate-applications", "Hồ sơ Guest Affiliate", "Duyệt đơn từ trang public.", ROUTES.ADMIN.AFFILIATE_APPLICATIONS, "users"),
          item("affiliate-conversions", "Hoa hồng Affiliate", "Theo dõi conversion và hoa hồng.", ROUTES.ADMIN.AFFILIATE_CONVERSIONS, "badge-percent"),
          item("affiliate-accounts", "Duyệt Customer Affiliate", "Duyệt customer tham gia affiliate.", ROUTES.ADMIN.AFFILIATE_ACCOUNTS, "badge-percent"),
        ],
      },
    ],
  },
  {
    key: "communication",
    label: "Communication",
    description: "Quản lý tin nhắn, bình luận và thông báo.",
    href: ROUTES.ADMIN.COMMUNICATION,
    iconName: "message-circle",
    permissions: ["messages.view", "comments.view", "system.view"],
    matchPrefixes: [ROUTES.ADMIN.COMMUNICATION, ROUTES.ADMIN.MESSAGES, ROUTES.ADMIN.COMMENTS, ROUTES.ADMIN.NOTIFICATIONS],
    sections: [
      {
        key: "communication",
        title: "Giao tiếp",
        description: "Các kênh tương tác trong hệ thống.",
        items: [
          item("messages", "Messages", "Theo dõi hội thoại.", ROUTES.ADMIN.MESSAGES, "message-circle", "messages.view"),
          item("comments", "Comments", "Kiểm duyệt bình luận.", ROUTES.ADMIN.COMMENTS, "messages-square", "comments.view"),
          item("notifications", "Notifications", "Quản lý thông báo hệ thống.", ROUTES.ADMIN.NOTIFICATIONS, "bell", "system.view"),
        ],
      },
    ],
  },
  {
    key: "analytics",
    label: "Analytics",
    description: "Theo dõi conversion events và mục tiêu đo lường.",
    href: ROUTES.ADMIN.ANALYTICS,
    iconName: "chart-no-axes-combined",
    permissions: ["analytics.view"],
    matchPrefixes: [ROUTES.ADMIN.ANALYTICS],
    sections: [
      {
        key: "analytics",
        title: "Phân tích",
        description: "Dữ liệu event và conversion goals.",
        items: [
          item("analytics-events", "Conversion/Event Analytics", "Xem event theo target.", ROUTES.ADMIN.ANALYTICS_EVENTS, "chart-no-axes-combined"),
          item("analytics-goals", "Analytics Goals", "Quản lý mục tiêu conversion.", ROUTES.ADMIN.ANALYTICS_GOALS, "search"),
        ],
      },
    ],
  },
  {
    key: "website",
    label: "Website",
    description: "Quản lý nội dung, marketing và nền tảng website.",
    href: ROUTES.ADMIN.CONTENT,
    iconName: "files",
    permissions: ["content.view", "marketing.view", "system.view"],
    matchPrefixes: [
      ROUTES.ADMIN.CONTENT,
      ROUTES.ADMIN.PAGES,
      ROUTES.ADMIN.MENUS,
      ROUTES.ADMIN.MARKETING,
      ROUTES.ADMIN.LANDING_PAGES,
      ROUTES.ADMIN.AUDIT_LOGS,
      ROUTES.ADMIN.DOMAIN_EVENTS,
      ROUTES.ADMIN.GLOBAL_FIELDS,
      ROUTES.ADMIN.MEDIA,
      ROUTES.ADMIN.HOOKS,
      ROUTES.ADMIN.SEO_GUIDE,
      ROUTES.ADMIN.SEO_PAGES,
      ROUTES.ADMIN.SEO_SCHEMA,
      ROUTES.ADMIN.SEO_RULES,
    ],
    sections: [
      {
        key: "content",
        title: "Nội dung website",
        description: "Trang và cấu trúc điều hướng website.",
        permissions: ["content.view"],
        items: [
          item("pages", "Pages", "Quản lý nội dung các trang của website.", ROUTES.ADMIN.PAGES, "files"),
          item("menus", "Navigation", "Quản lý menu và cấu trúc điều hướng.", ROUTES.ADMIN.MENUS, "menu"),
        ],
      },
      {
        key: "marketing",
        title: "Marketing",
        description: "Landing page, chiến dịch và thử nghiệm.",
        permissions: ["marketing.view"],
        items: [
          item("landing-pages", "Landing Pages", "Tạo và quản lý landing page.", ROUTES.ADMIN.LANDING_PAGES, "blocks"),
          item("campaigns", "Campaigns", "Quản lý chiến dịch marketing.", ROUTES.ADMIN.MARKETING_CAMPAIGNS, "badge-percent"),
          item("ab-tests", "A/B Tests", "Quản lý thử nghiệm và biến thể.", ROUTES.ADMIN.AB_EXPERIMENTS, "search"),
        ],
      },
      {
        key: "platform",
        title: "Nền tảng website",
        description: "Audit, event, field và media dùng chung cho website.",
        permissions: ["system.view"],
        items: [
          item("audit-logs", "Audit Logs", "Theo dõi lịch sử thay đổi.", ROUTES.ADMIN.AUDIT_LOGS, "radio"),
          item("domain-events", "Domain Events", "Kiểm tra sự kiện nghiệp vụ.", ROUTES.ADMIN.DOMAIN_EVENTS, "radio"),
          item("global-fields", "Global Fields", "Quản lý field dùng chung.", ROUTES.ADMIN.GLOBAL_FIELDS, "list-tree"),
          item("media-library", "Media Library", "Quản lý kho hình ảnh và file.", ROUTES.ADMIN.MEDIA_LIBRARY, "image"),
          item("media-collections", "Media Collections", "Quản lý bộ sưu tập media.", ROUTES.ADMIN.MEDIA_COLLECTIONS, "image"),
        ],
      },
    ],
  },
  {
    key: "blog",
    label: "Blog",
    description: "Quản lý bài viết và danh mục blog.",
    href: ROUTES.ADMIN.BLOG,
    iconName: "book-open-text",
    permissions: ["content.view"],
    matchPrefixes: [ROUTES.ADMIN.BLOG],
    sections: [
      {
        key: "content",
        title: "Nội dung Blog",
        description: "Quản lý bài viết và hệ thống danh mục.",
        permissions: ["content.view"],
        items: [
          item("blog-posts", "Blog Posts", "Viết, chỉnh sửa và xuất bản bài viết.", ROUTES.ADMIN.BLOG_POSTS, "book-open-text"),
          item("blog-categories", "Blog Categories", "Quản lý danh mục bài viết.", ROUTES.ADMIN.BLOG_CATEGORIES, "tags"),
        ],
      },
    ],
  },
  {
    key: "configuration",
    label: "Configuration",
    description: "Cấu hình nhận diện, SEO, ecommerce, tích hợp và backup.",
    href: ROUTES.ADMIN.CONFIG,
    iconName: "settings",
    permissions: ["configuration.view"],
    matchPrefixes: [ROUTES.ADMIN.CONFIG],
    sections: [],
  },
];

export const ADMIN_NAV_AUXILIARY_ITEMS = [
  {
    key: "view-website",
    label: "View Website",
    href: ROUTES.HOME,
    iconName: "external-link" as const,
  },
];

function hasPermission(permission: string, permissionKeys?: string[]) {
  return !permissionKeys || permissionKeys.includes(permission);
}

function canAccessPermissions(permissions: string[] | undefined, permissionKeys?: string[]) {
  return !permissions?.length || permissions.some((permission) => hasPermission(permission, permissionKeys));
}

export function canAccessAdminFeature(feature: AdminFeatureDefinition, permissionKeys?: string[]) {
  return canAccessPermissions(feature.permissions, permissionKeys);
}

export function canAccessAdminFeatureSection(section: AdminFeatureSection, permissionKeys?: string[]) {
  return canAccessPermissions(section.permissions, permissionKeys);
}

export function canAccessAdminFeatureItem(entry: AdminFeatureItem, permissionKeys?: string[]) {
  return !entry.permission || hasPermission(entry.permission, permissionKeys);
}

export function getAdminFeature(key: string) {
  return ADMIN_FEATURES.find((feature) => feature.key === key);
}
