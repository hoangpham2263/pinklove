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
  | "external-link"
  | "panels-top-left"
  | "newspaper";

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
  hideHeader?: boolean;
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
  excludePrefixes?: string[];
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
    description: "Quản lý offering, đơn hàng, thanh toán và vận chuyển.",
    href: ROUTES.ADMIN.COMMERCE,
    iconName: "shopping-bag",
    permissions: ["offerings.view", "commerce.view"],
    matchPrefixes: [
      ROUTES.ADMIN.COMMERCE,
      ROUTES.ADMIN.OFFERING_LIST,
      ROUTES.ADMIN.ORDERS,
      ROUTES.ADMIN.PAYMENTS,
      ROUTES.ADMIN.SHIPMENTS,
    ],
    sections: [
      {
        key: "offerings",
        title: "Offerings",
        description: "Sản phẩm, dịch vụ, template và cấu trúc offering.",
        permissions: ["offerings.view"],
        items: [
          item("offering-list", "Quản lý sản phẩm", "Tìm kiếm, chỉnh sửa và cập nhật catalog.", ROUTES.ADMIN.OFFERING_LIST, "boxes"),
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
    ],
  },
  {
    key: "bookings",
    label: "Bookings",
    description: "Quản lý lịch dịch vụ và wedding planning của khách.",
    href: ROUTES.ADMIN.BOOKING,
    iconName: "calendar-clock",
    permissions: ["bookings.view", "planning.view"],
    matchPrefixes: [
      ROUTES.ADMIN.BOOKING,
      ROUTES.ADMIN.BOOKINGS,
      ROUTES.ADMIN.BOOKING,
      ROUTES.ADMIN.WEDDING_PLANNING,
    ],
    sections: [
      {
        key: "booking",
        title: "Service bookings",
        description: "Lịch đặt dịch vụ, provider liên quan và trạng thái thanh toán.",
        permissions: ["bookings.view"],
        items: [
          item("bookings", "Bookings", "Theo dõi và cập nhật lịch đặt dịch vụ.", ROUTES.ADMIN.BOOKINGS, "calendar-clock"),
        ],
      },
      {
        key: "planning",
        title: "Wedding Planning",
        description: "Wedding site, RSVP, khách mời, seating, task và timeline.",
        permissions: ["planning.view"],
        items: [
          item("wedding-planning", "Wedding Planning", "Theo dõi toàn bộ quy trình planning.", ROUTES.ADMIN.WEDDING_PLANNING, "calendar-clock"),
        ],
      },
    ],
  },
  {
    key: "providers",
    label: "Providers",
    description: "Quản lý tài khoản, hồ sơ và vận hành nhà cung cấp.",
    href: ROUTES.ADMIN.PROVIDERS,
    iconName: "store",
    permissions: ["marketplace.view", "accounts.view"],
    matchPrefixes: [ROUTES.ADMIN.PROVIDERS],
    sections: [
      {
        key: "provider-accounts",
        title: "Tài khoản nhà cung cấp",
        description: "Account đăng nhập có role PROVIDER và trạng thái truy cập portal.",
        permissions: ["accounts.view"],
        items: [
          item("provider-accounts", "Provider Accounts", "Quản lý account đăng nhập của nhà cung cấp.", ROUTES.ADMIN.PROVIDER_ACCOUNTS, "users"),
        ],
      },
      {
        key: "providers",
        title: "Hồ sơ nhà cung cấp",
        description: "Danh bạ provider, lead, review và lịch khả dụng.",
        items: [
          item("providers", "Provider Directory", "Quản lý hồ sơ provider trên marketplace.", ROUTES.ADMIN.PROVIDERS, "store"),
          item("provider-leads", "Leads & Quotes", "Theo dõi lead và yêu cầu báo giá.", ROUTES.ADMIN.PROVIDER_LEADS, "messages-square"),
          item("provider-reviews", "Reviews", "Kiểm duyệt đánh giá provider.", ROUTES.ADMIN.PROVIDER_REVIEWS, "messages-square"),
          item("provider-availability", "Provider Availability", "Kiểm tra lịch khả dụng.", ROUTES.ADMIN.PROVIDER_AVAILABILITY, "calendar-clock"),
        ],
      },
      {
        key: "sourcing",
        title: "Nguồn cung & duyệt dịch vụ",
        description: "Nhu cầu sourcing, yêu cầu supplier và offering provider gửi lên.",
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
    description: "Quản lý actor đăng nhập, phân quyền và trạng thái account.",
    href: ROUTES.ADMIN.ACCOUNTS,
    iconName: "users",
    permissions: ["accounts.view"],
    matchPrefixes: [
      ROUTES.ADMIN.ACCOUNTS,
      ROUTES.ADMIN.USERS,
      ROUTES.ADMIN.CUSTOMERS,
      ROUTES.ADMIN.INTERNAL_ACCOUNTS,
      ROUTES.ADMIN.ACCESS_ROLES,
    ],
    sections: [
      {
        key: "accounts",
        title: "Actor accounts",
        description: "Người dùng, khách hàng, tài khoản nội bộ và quyền Admin.",
        permissions: ["accounts.view"],
        items: [
          item("users", "Users", "Quản lý toàn bộ tài khoản.", ROUTES.ADMIN.USERS, "users", "accounts.manage"),
          item("customers", "Customers", "Quản lý tài khoản khách hàng.", ROUTES.ADMIN.CUSTOMERS, "users"),
          item("internal-accounts", "Internal Accounts", "Quản lý kênh vận hành nội bộ.", ROUTES.ADMIN.INTERNAL_ACCOUNTS, "users"),
          item("access-roles", "Access Roles", "Quản lý vai trò và quyền Admin.", ROUTES.ADMIN.ACCESS_ROLES, "settings", "accounts.manage"),
        ],
      },
    ],
  },
  {
    key: "affiliates",
    label: "Affiliates",
    description: "Vận hành kênh affiliate và hoa hồng.",
    href: ROUTES.ADMIN.AFFILIATES,
    iconName: "badge-percent",
    permissions: ["affiliates.view"],
    matchPrefixes: [ROUTES.ADMIN.AFFILIATES],
    sections: [
      {
        key: "affiliate",
        title: "Chương trình affiliate",
        description: "Tài khoản affiliate, hồ sơ đăng ký, duyệt tham gia và conversion.",
        permissions: ["affiliates.view"],
        hideHeader: true,
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
    key: "marketing",
    label: "Marketing",
    description: "Quản lý landing page, campaign, quảng cáo và thử nghiệm.",
    href: ROUTES.ADMIN.MARKETING,
    iconName: "badge-percent",
    permissions: ["marketing.view"],
    matchPrefixes: [ROUTES.ADMIN.MARKETING, ROUTES.ADMIN.LANDING_PAGES],
    sections: [
      {
        key: "campaigns",
        title: "Campaigns & landing pages",
        description: "Landing page, chiến dịch và thử nghiệm tăng trưởng.",
        permissions: ["marketing.view"],
        items: [
          item("landing-pages", "Landing Pages", "Tạo và quản lý landing page.", ROUTES.ADMIN.LANDING_PAGES, "blocks"),
          item("campaigns", "Campaigns", "Quản lý chiến dịch marketing.", ROUTES.ADMIN.MARKETING_CAMPAIGNS, "badge-percent"),
          item("ab-tests", "A/B Tests", "Quản lý thử nghiệm và biến thể.", ROUTES.ADMIN.AB_EXPERIMENTS, "search"),
        ],
      },
      {
        key: "ads",
        title: "Ads & Priority",
        description: "Banner thuê ngoài, placement và ưu tiên hiển thị provider.",
        permissions: ["marketing.view"],
        items: [
          item("ads", "Ads Overview", "Tổng quan quảng cáo và ưu tiên hiển thị.", ROUTES.ADMIN.MARKETING_ADS, "panels-top-left"),
          item("advertisers", "Advertisers", "Hồ sơ bên ngoài thuê đặt quảng cáo.", ROUTES.ADMIN.MARKETING_ADVERTISERS, "briefcase-business"),
          item("placements", "Placements", "Vị trí render banner và priority listing.", ROUTES.ADMIN.MARKETING_AD_PLACEMENTS, "panels-top-left"),
          item("banner-ads", "Banner Ads", "Quản lý campaign/banner thuê ngoài.", ROUTES.ADMIN.MARKETING_BANNER_ADS, "image"),
          item("ad-creatives", "Creatives", "Quản lý hình ảnh, CTA và link đích.", ROUTES.ADMIN.MARKETING_AD_CREATIVES, "image"),
          item("provider-priority", "Sponsored Providers", "Ưu tiên hiển thị provider/xưởng top.", ROUTES.ADMIN.MARKETING_PROVIDER_PRIORITY, "store"),
        ],
      },
    ],
  },
  {
    key: "website",
    label: "Website",
    description: "Quản lý nội dung, SEO, điều hướng và media website.",
    href: ROUTES.ADMIN.CONTENT,
    iconName: "panels-top-left",
    permissions: ["content.view", "system.view"],
    matchPrefixes: [
      ROUTES.ADMIN.CONTENT,
      ROUTES.ADMIN.PAGES,
      ROUTES.ADMIN.MENUS,
      ROUTES.ADMIN.AUDIT_LOGS,
      ROUTES.ADMIN.DOMAIN_EVENTS,
      ROUTES.ADMIN.GLOBAL_FIELDS,
      ROUTES.ADMIN.MEDIA,
      ROUTES.ADMIN.HOOKS,
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
        key: "seo",
        title: "SEO",
        description: "SEO từng trang, schema, rule và hướng dẫn tối ưu.",
        permissions: ["content.view"],
        items: [
          item("seo-pages", "Page SEO", "Quản lý SEO cho từng trang.", ROUTES.ADMIN.SEO_PAGES, "search"),
          item("seo-rules", "SEO Rules", "Quản lý rule SEO và index.", ROUTES.ADMIN.SEO_RULES, "search"),
          item("seo-schema", "SEO Schema", "Quản lý structured data.", ROUTES.ADMIN.SEO_SCHEMA, "file-code-2"),
        ],
      },
      {
        key: "platform",
        title: "Media & dữ liệu dùng chung",
        description: "Media library, collection, global field, audit và domain event.",
        permissions: ["system.view"],
        items: [
          item("global-fields", "Global Fields", "Quản lý field dùng chung.", ROUTES.ADMIN.GLOBAL_FIELDS, "list-tree"),
          item("media-library", "Media Library", "Quản lý kho hình ảnh và file.", ROUTES.ADMIN.MEDIA_LIBRARY, "image"),
          item("media-collections", "Media Collections", "Quản lý bộ sưu tập media.", ROUTES.ADMIN.MEDIA_COLLECTIONS, "image"),
          item("audit-logs", "Audit Logs", "Theo dõi lịch sử thay đổi.", ROUTES.ADMIN.AUDIT_LOGS, "radio"),
          item("domain-events", "Domain Events", "Kiểm tra sự kiện nghiệp vụ.", ROUTES.ADMIN.DOMAIN_EVENTS, "radio"),
          item("hooks", "Hooks", "Kiểm tra hook và tích hợp runtime.", ROUTES.ADMIN.HOOKS, "radio"),
        ],
      },
    ],
  },
  {
    key: "blog",
    label: "Blog",
    description: "Quản lý bài viết và danh mục blog.",
    href: ROUTES.ADMIN.BLOG,
    iconName: "newspaper",
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
