import { ROUTES } from "@/lib/routes";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbContext = {
  pathname: string;
  params: Record<string, string>;
};

type BreadcrumbSpec = {
  pattern: string;
  items: BreadcrumbItem[] | ((context: BreadcrumbContext) => BreadcrumbItem[]);
};

const SHELL_ROOT_LABELS: Record<string, string> = {
  admin: "Admin",
  customer: "Tài khoản",
  provider: "Provider",
};

const APP_BREADCRUMB_SPECS: BreadcrumbSpec[] = [
  { pattern: ROUTES.ADMIN.DASHBOARD, items: [{ label: "Admin" }, { label: "Dashboard" }] },
  { pattern: ROUTES.ADMIN.MESSAGES, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Tin nhắn" }] },
  { pattern: ROUTES.ADMIN.NOTIFICATIONS, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Thông báo" }] },
  { pattern: ROUTES.ADMIN.MEDIA, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Media" }] },
  { pattern: ROUTES.ADMIN.GLOBAL_FIELDS, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Global Fields" }] },
  { pattern: ROUTES.ADMIN.HOOKS, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Hooks" }] },

  { pattern: ROUTES.ADMIN.PAGES, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Danh sách Trang" }] },
  { pattern: "/admin/pages/[...slug]", items: ({ params }) => [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Danh sách Trang", href: ROUTES.ADMIN.PAGES }, { label: getRouteParamBreadcrumbLabel(params.slug) }] },
  { pattern: ROUTES.ADMIN.MENUS, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Navigation" }] },
  { pattern: "/admin/menus/[name]", items: ({ params }) => [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Navigation", href: ROUTES.ADMIN.MENUS }, { label: getRouteParamBreadcrumbLabel(params.name) }] },
  { pattern: ROUTES.ADMIN.BLOG, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Blog Posts" }] },
  { pattern: "/admin/blog/[slug]", items: ({ params }) => [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Blog Posts", href: ROUTES.ADMIN.BLOG }, { label: getRouteParamBreadcrumbLabel(params.slug) }] },
  { pattern: ROUTES.ADMIN.BLOG_CATEGORIES, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Blog Categories" }] },
  { pattern: ROUTES.ADMIN.BLOG_CATEGORY("[slug]"), items: ({ params }) => [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Blog Categories", href: ROUTES.ADMIN.BLOG_CATEGORIES }, { label: getRouteParamBreadcrumbLabel(params.slug) }] },
  { pattern: ROUTES.ADMIN.SEO_GUIDE, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "SEO Guide" }] },
  { pattern: ROUTES.ADMIN.SEO_PAGES, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "SEO Pages" }] },
  { pattern: ROUTES.ADMIN.SEO_SCHEMA, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "SEO Schema" }] },
  { pattern: ROUTES.ADMIN.SEO_RULES, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "SEO Rules" }] },

  { pattern: ROUTES.ADMIN.OFFERING_LIST, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Offerings Overview" }] },
  { pattern: ROUTES.ADMIN.OFFERING_MANAGE, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Offerings", href: ROUTES.ADMIN.OFFERING_LIST }, { label: "Quản lý" }] },
  { pattern: ROUTES.ADMIN.OFFERINGS, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Sản phẩm", href: ROUTES.ADMIN.OFFERING_LIST }, { label: "Tạo sản phẩm" }] },
  { pattern: ROUTES.ADMIN.OFFERING_TYPES, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Offering Types" }] },
  { pattern: ROUTES.ADMIN.OFFERING_TEMPLATES, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Offering Templates" }] },
  { pattern: ROUTES.ADMIN.OFFERING_TEMPLATE("[slug]"), items: ({ params }) => [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Offering Templates", href: ROUTES.ADMIN.OFFERING_TEMPLATES }, { label: getRouteParamBreadcrumbLabel(params.slug) }] },
  { pattern: ROUTES.ADMIN.OFFERING_BUILDER, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Offering Builder" }] },
  { pattern: ROUTES.ADMIN.OFFERING_BUILDER_CREATE, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Offering Builder", href: ROUTES.ADMIN.OFFERING_BUILDER }, { label: "Create" }] },
  { pattern: ROUTES.ADMIN.OFFERING_BUILDER_EDITOR("[slug]"), items: ({ params }) => [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Offering Builder", href: ROUTES.ADMIN.OFFERING_BUILDER }, { label: getRouteParamBreadcrumbLabel(params.slug) }] },
  { pattern: "/admin/offerings/[slug]", items: ({ params }) => [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Sản phẩm", href: ROUTES.ADMIN.OFFERING_LIST }, { label: getRouteParamBreadcrumbLabel(params.slug) }] },
  { pattern: ROUTES.ADMIN.OFFERING_CATEGORIES, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Offering Categories" }] },
  { pattern: ROUTES.ADMIN.OFFERING_CATEGORY("[slug]"), items: ({ params }) => [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Offering Categories", href: ROUTES.ADMIN.OFFERING_CATEGORIES }, { label: getRouteParamBreadcrumbLabel(params.slug) }] },
  { pattern: ROUTES.ADMIN.PROVIDER_OFFERINGS, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Provider Submissions" }] },
  { pattern: "/admin/providers/offerings/[id]", items: ({ params }) => [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Provider Submissions", href: ROUTES.ADMIN.PROVIDER_OFFERINGS }, { label: getRouteParamBreadcrumbLabel(params.id) }] },

  { pattern: ROUTES.ADMIN.ORDERS, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Orders" }] },
  { pattern: "/admin/orders/[id]", items: ({ params }) => [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Orders", href: ROUTES.ADMIN.ORDERS }, { label: getRouteParamBreadcrumbLabel(params.id) }] },
  { pattern: ROUTES.ADMIN.PAYMENTS, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Payments" }] },
  { pattern: ROUTES.ADMIN.SHIPMENTS, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Shipments" }] },

  { pattern: ROUTES.ADMIN.USERS, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Người dùng" }] },
  { pattern: ROUTES.ADMIN.USERS_CREATE, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Người dùng", href: ROUTES.ADMIN.USERS }, { label: "Tạo người dùng" }] },
  { pattern: "/admin/users/[id]", items: ({ params }) => [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Người dùng", href: ROUTES.ADMIN.USERS }, { label: getRouteParamBreadcrumbLabel(params.id) }] },
  { pattern: ROUTES.ADMIN.CUSTOMERS, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Khách hàng" }] },
  { pattern: ROUTES.ADMIN.CUSTOMERS_CREATE, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Khách hàng", href: ROUTES.ADMIN.CUSTOMERS }, { label: "Tạo khách hàng" }] },
  { pattern: ROUTES.ADMIN.AFFILIATE_USERS, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Đối tác / CTV" }] },
  { pattern: ROUTES.ADMIN.AFFILIATE_USERS_CREATE, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Đối tác / CTV", href: ROUTES.ADMIN.AFFILIATE_USERS }, { label: "Tạo đối tác / CTV" }] },
  { pattern: ROUTES.ADMIN.AFFILIATES, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Quản lý affiliate" }] },
  { pattern: ROUTES.ADMIN.INTERNAL_ACCOUNTS, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Tài khoản nội bộ" }] },
  { pattern: ROUTES.ADMIN.PROVIDER_ACCOUNTS, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Nhà cung cấp" }] },
  { pattern: ROUTES.ADMIN.PROVIDER_ACCOUNTS_CREATE, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Nhà cung cấp", href: ROUTES.ADMIN.PROVIDER_ACCOUNTS }, { label: "Tạo nhà cung cấp" }] },
  { pattern: "/admin/providers/accounts/[id]", items: ({ params }) => [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Nhà cung cấp", href: ROUTES.ADMIN.PROVIDER_ACCOUNTS }, { label: getRouteParamBreadcrumbLabel(params.id) }] },

  { pattern: ROUTES.ADMIN.CONFIG, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Configuration" }] },
  { pattern: ROUTES.ADMIN.CONFIG_BRANDING, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Configuration", href: ROUTES.ADMIN.CONFIG }, { label: "Branding" }] },
  { pattern: ROUTES.ADMIN.CONFIG_BREADCRUMBS, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Configuration", href: ROUTES.ADMIN.CONFIG }, { label: "Breadcrumbs" }] },
  { pattern: ROUTES.ADMIN.CONFIG_ECOMMERCE, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Configuration", href: ROUTES.ADMIN.CONFIG }, { label: "Ecommerce" }] },
  { pattern: "/admin/config/commerce", items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Configuration", href: ROUTES.ADMIN.CONFIG }, { label: "Commerce" }] },
  { pattern: ROUTES.ADMIN.CONFIG_EMAIL, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Configuration", href: ROUTES.ADMIN.CONFIG }, { label: "Email" }] },
  { pattern: ROUTES.ADMIN.CONFIG_FAVICON, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Configuration", href: ROUTES.ADMIN.CONFIG }, { label: "Favicon" }] },
  { pattern: ROUTES.ADMIN.CONFIG_INTERNAL_APIS, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Configuration", href: ROUTES.ADMIN.CONFIG }, { label: "API nội bộ" }] },
  { pattern: ROUTES.ADMIN.CONFIG_INTERNAL_API_OFFERINGS, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Configuration", href: ROUTES.ADMIN.CONFIG }, { label: "API nội bộ", href: ROUTES.ADMIN.CONFIG_INTERNAL_APIS }, { label: "API import sản phẩm" }] },
  { pattern: ROUTES.ADMIN.CONFIG_OPENGRAPH, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Configuration", href: ROUTES.ADMIN.CONFIG }, { label: "Open Graph" }] },
  { pattern: ROUTES.ADMIN.CONFIG_PAYMENT_METHODS, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Configuration", href: ROUTES.ADMIN.CONFIG }, { label: "Payment Methods" }] },
  { pattern: ROUTES.ADMIN.CONFIG_PAYMENT_METHOD_NEW, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Configuration", href: ROUTES.ADMIN.CONFIG }, { label: "Payment Methods", href: ROUTES.ADMIN.CONFIG_PAYMENT_METHODS }, { label: "Thêm phương thức thanh toán" }] },
  {
    pattern: "/admin/config/payment-methods/[code]",
    items: ({ params }) => [
      { label: "Admin", href: ROUTES.ADMIN.DASHBOARD },
      { label: "Configuration", href: ROUTES.ADMIN.CONFIG },
      { label: "Payment Methods", href: ROUTES.ADMIN.CONFIG_PAYMENT_METHODS },
      { label: getPaymentMethodBreadcrumbLabel(params.code ?? "") },
    ],
  },
  { pattern: ROUTES.ADMIN.CONFIG_SITEMAP_INDEX, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Configuration", href: ROUTES.ADMIN.CONFIG }, { label: "Sitemap Index" }] },
  { pattern: ROUTES.ADMIN.CONFIG_SITEMAP_SETTINGS, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Configuration", href: ROUTES.ADMIN.CONFIG }, { label: "Sitemap Settings" }] },
  { pattern: ROUTES.ADMIN.CONFIG_SEO_REDIRECTS, items: [{ label: "Admin", href: ROUTES.ADMIN.DASHBOARD }, { label: "Configuration", href: ROUTES.ADMIN.CONFIG }, { label: "SEO Redirects" }] },

  { pattern: ROUTES.CUSTOMER.DASHBOARD, items: [{ label: "Tài khoản" }, { label: "Dashboard" }] },
  { pattern: ROUTES.CUSTOMER.INVITATIONS, items: [{ label: "Tài khoản", href: ROUTES.CUSTOMER.DASHBOARD }, { label: "Thiệp của tôi" }] },
  { pattern: "/customer/invitations/[id]", items: ({ params }) => [{ label: "Tài khoản", href: ROUTES.CUSTOMER.DASHBOARD }, { label: "Thiệp của tôi", href: ROUTES.CUSTOMER.INVITATIONS }, { label: getRouteParamBreadcrumbLabel(params.id) }] },
  { pattern: ROUTES.CUSTOMER.ORDERS, items: [{ label: "Tài khoản", href: ROUTES.CUSTOMER.DASHBOARD }, { label: "Đơn hàng của tôi" }] },
  { pattern: "/customer/orders/[id]", items: ({ params }) => [{ label: "Tài khoản", href: ROUTES.CUSTOMER.DASHBOARD }, { label: "Đơn hàng của tôi", href: ROUTES.CUSTOMER.ORDERS }, { label: getRouteParamBreadcrumbLabel(params.id) }] },
  { pattern: ROUTES.CUSTOMER.MESSAGES, items: [{ label: "Tài khoản", href: ROUTES.CUSTOMER.DASHBOARD }, { label: "Tin nhắn" }] },
  { pattern: ROUTES.CUSTOMER.CONFIG, items: [{ label: "Tài khoản", href: ROUTES.CUSTOMER.DASHBOARD }, { label: "Configs" }] },
  { pattern: ROUTES.CUSTOMER.CONFIG_PROFILE, items: [{ label: "Tài khoản", href: ROUTES.CUSTOMER.DASHBOARD }, { label: "Configs", href: ROUTES.CUSTOMER.CONFIG }, { label: "Hồ sơ" }] },
  { pattern: ROUTES.CUSTOMER.CONFIG_ADDRESSES, items: [{ label: "Tài khoản", href: ROUTES.CUSTOMER.DASHBOARD }, { label: "Configs", href: ROUTES.CUSTOMER.CONFIG }, { label: "Địa chỉ" }] },
  { pattern: ROUTES.CUSTOMER.CONFIG_ADDRESS_NEW, items: [{ label: "Tài khoản", href: ROUTES.CUSTOMER.DASHBOARD }, { label: "Configs", href: ROUTES.CUSTOMER.CONFIG }, { label: "Địa chỉ", href: ROUTES.CUSTOMER.CONFIG_ADDRESSES }, { label: "Thêm địa chỉ" }] },
  { pattern: "/customer/config/addresses/[id]", items: ({ params }) => [{ label: "Tài khoản", href: ROUTES.CUSTOMER.DASHBOARD }, { label: "Configs", href: ROUTES.CUSTOMER.CONFIG }, { label: "Địa chỉ", href: ROUTES.CUSTOMER.CONFIG_ADDRESSES }, { label: getRouteParamBreadcrumbLabel(params.id) }] },
  { pattern: "/customer/config/addresses/[id]/edit", items: ({ params }) => [{ label: "Tài khoản", href: ROUTES.CUSTOMER.DASHBOARD }, { label: "Configs", href: ROUTES.CUSTOMER.CONFIG }, { label: "Địa chỉ", href: ROUTES.CUSTOMER.CONFIG_ADDRESSES }, { label: getRouteParamBreadcrumbLabel(params.id) }] },
  { pattern: ROUTES.CUSTOMER.AFFILIATE, items: [{ label: "Tài khoản", href: ROUTES.CUSTOMER.DASHBOARD }, { label: "Tiếp thị liên kết" }] },
  { pattern: ROUTES.CUSTOMER.AFFILIATE_LINKS, items: [{ label: "Tài khoản", href: ROUTES.CUSTOMER.DASHBOARD }, { label: "Tiếp thị liên kết", href: ROUTES.CUSTOMER.AFFILIATE }, { label: "Tạo link" }] },
  { pattern: ROUTES.CUSTOMER.PROVIDER, items: [{ label: "Tài khoản", href: ROUTES.CUSTOMER.DASHBOARD }, { label: "Không gian nhà cung cấp" }] },
  { pattern: "/customer/design/[id]", items: ({ params }) => [{ label: "Tài khoản", href: ROUTES.CUSTOMER.DASHBOARD }, { label: "Thiệp của tôi", href: ROUTES.CUSTOMER.INVITATIONS }, { label: getRouteParamBreadcrumbLabel(params.id) }] },

  { pattern: ROUTES.PROVIDER.CONFIG, items: [{ label: "Đối tác", href: ROUTES.PROVIDER.DASHBOARD }, { label: "Cấu hình" }] },
  { pattern: ROUTES.PROVIDER.CONFIG_ACCOUNT, items: [{ label: "Đối tác", href: ROUTES.PROVIDER.DASHBOARD }, { label: "Cấu hình", href: ROUTES.PROVIDER.CONFIG }, { label: "Tài khoản" }] },
  { pattern: ROUTES.PROVIDER.CONFIG_ADDRESSES, items: [{ label: "Đối tác", href: ROUTES.PROVIDER.DASHBOARD }, { label: "Cấu hình", href: ROUTES.PROVIDER.CONFIG }, { label: "Địa chỉ" }] },
  { pattern: ROUTES.PROVIDER.CONFIG_ADDRESS_NEW, items: [{ label: "Đối tác", href: ROUTES.PROVIDER.DASHBOARD }, { label: "Cấu hình", href: ROUTES.PROVIDER.CONFIG }, { label: "Địa chỉ", href: ROUTES.PROVIDER.CONFIG_ADDRESSES }, { label: "Thêm địa chỉ" }] },
  { pattern: ROUTES.PROVIDER.MESSAGES, items: [{ label: "Đối tác", href: ROUTES.PROVIDER.DASHBOARD }, { label: "Tin nhắn" }] },
  { pattern: "/provider/config/addresses/[id]", items: ({ params }) => [{ label: "Đối tác", href: ROUTES.PROVIDER.DASHBOARD }, { label: "Cấu hình", href: ROUTES.PROVIDER.CONFIG }, { label: "Địa chỉ", href: ROUTES.PROVIDER.CONFIG_ADDRESSES }, { label: getRouteParamBreadcrumbLabel(params.id) }] },
  { pattern: "/provider/config/addresses/[id]/edit", items: ({ params }) => [{ label: "Đối tác", href: ROUTES.PROVIDER.DASHBOARD }, { label: "Cấu hình", href: ROUTES.PROVIDER.CONFIG }, { label: "Địa chỉ", href: ROUTES.PROVIDER.CONFIG_ADDRESSES }, { label: getRouteParamBreadcrumbLabel(params.id) }] },
  { pattern: ROUTES.PROVIDER.DASHBOARD, items: [{ label: "Đối tác" }, { label: "Dashboard" }] },
  { pattern: ROUTES.PROVIDER.ORDERS, items: [{ label: "Đối tác", href: ROUTES.PROVIDER.DASHBOARD }, { label: "Đơn được giao" }] },
  { pattern: ROUTES.PROVIDER.OFFERINGS, items: [{ label: "Đối tác", href: ROUTES.PROVIDER.DASHBOARD }, { label: "Yêu cầu sản phẩm" }] },
  { pattern: ROUTES.PROVIDER.OFFERING_NEW, items: [{ label: "Đối tác", href: ROUTES.PROVIDER.DASHBOARD }, { label: "Yêu cầu sản phẩm", href: ROUTES.PROVIDER.OFFERINGS }, { label: "Tạo yêu cầu" }] },
  { pattern: "/provider/offerings/[id]", items: ({ params }) => [{ label: "Đối tác", href: ROUTES.PROVIDER.DASHBOARD }, { label: "Yêu cầu sản phẩm", href: ROUTES.PROVIDER.OFFERINGS }, { label: getRouteParamBreadcrumbLabel(params.id) }] },
  { pattern: "/provider/orders/[id]", items: ({ params }) => [{ label: "Đối tác", href: ROUTES.PROVIDER.DASHBOARD }, { label: "Đơn được giao", href: ROUTES.PROVIDER.ORDERS }, { label: getRouteParamBreadcrumbLabel(params.id) }] },
  { pattern: ROUTES.PROVIDER.AVAILABLE_TEMPLATES, items: [{ label: "Đối tác", href: ROUTES.PROVIDER.DASHBOARD }, { label: "Sản phẩm cần nguồn hàng" }] },
  { pattern: ROUTES.PROVIDER.SUPPLY_REQUESTS, items: [{ label: "Đối tác", href: ROUTES.PROVIDER.DASHBOARD }, { label: "Yêu cầu cung ứng" }] },
];

function normalizePathname(pathname: string) {
  if (!pathname) return "/";
  const [rawPath] = pathname.split(/[?#]/, 1);
  const trimmed = rawPath.replace(/\/+$/, "");
  return trimmed || "/";
}

function splitPath(pathname: string) {
  const normalized = normalizePathname(pathname);
  if (normalized === "/") return [];
  return normalized.slice(1).split("/");
}

function humanizeSegment(segment: string) {
  const value = decodeURIComponent(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!value) return "";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getRouteParamBreadcrumbLabel(value: string | undefined, fallback = "Chi tiết") {
  if (!value) return fallback;

  const [lastSegment] = value.split("/").filter(Boolean).slice(-1);
  const label = humanizeSegment(lastSegment ?? value);

  return label || fallback;
}

function getPaymentMethodBreadcrumbLabel(code: string) {
  const normalizedCode = decodeURIComponent(code).trim();

  switch (normalizedCode) {
    case "bank_transfer":
      return "Chuyển khoản QR";
    case "cod":
      return "Thanh toán tiền mặt";
    case "pay2s":
      return "Pay2S VietQR";
    case "vnpay":
      return "VNPAY";
    default:
      return humanizeSegment(normalizedCode);
  }
}

function getPatternSpecificity(pattern: string) {
  return splitPath(pattern).reduce((score, segment) => {
    if (/^\[\.\.\..+\]$/.test(segment)) return score + 1;
    if (/^\[.+\]$/.test(segment)) return score + 5;
    return score + 10;
  }, 0);
}

function matchPattern(pattern: string, pathname: string): Record<string, string> | null {
  const patternSegments = splitPath(pattern);
  const pathSegments = splitPath(pathname);
  const params: Record<string, string> = {};

  let pathIndex = 0;

  for (let patternIndex = 0; patternIndex < patternSegments.length; patternIndex += 1) {
    const patternSegment = patternSegments[patternIndex];
    const pathSegment = pathSegments[pathIndex];

    if (/^\[\.\.\.(.+)\]$/.test(patternSegment)) {
      const key = patternSegment.slice(4, -1);
      params[key] = pathSegments.slice(pathIndex).join("/");
      return params;
    }

    if (pathSegment === undefined) {
      return null;
    }

    if (/^\[(.+)\]$/.test(patternSegment)) {
      params[patternSegment.slice(1, -1)] = pathSegment;
      pathIndex += 1;
      continue;
    }

    if (patternSegment !== pathSegment) {
      return null;
    }

    pathIndex += 1;
  }

  return pathIndex === pathSegments.length ? params : null;
}

function getShellRootItem(pathname: string): BreadcrumbItem | null {
  const [rootSegment] = splitPath(pathname);

  if (!rootSegment) return null;

  if (rootSegment === "admin") {
    return { label: SHELL_ROOT_LABELS[rootSegment], href: ROUTES.ADMIN.DASHBOARD };
  }

  if (rootSegment === "customer") {
    return { label: SHELL_ROOT_LABELS[rootSegment], href: ROUTES.CUSTOMER.DASHBOARD };
  }

  if (rootSegment === "provider") {
    return { label: SHELL_ROOT_LABELS[rootSegment], href: ROUTES.PROVIDER.DASHBOARD };
  }

  return null;
}

function buildFallbackBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = splitPath(pathname);

  if (segments.length === 0) {
    return [];
  }

  const items: BreadcrumbItem[] = [];
  const rootItem = getShellRootItem(pathname);

  if (rootItem) {
    items.push(rootItem);
  }

  let currentPath = "";
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    if (index === 0 && rootItem) {
      return;
    }

    items.push({
      label: humanizeSegment(segment),
      href: index === segments.length - 1 ? undefined : currentPath,
    });
  });

  return items;
}

export function getRouteBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const normalizedPathname = normalizePathname(pathname);
  let bestMatch:
    | {
        specificity: number;
        items: BreadcrumbItem[];
      }
    | null = null;

  for (const spec of APP_BREADCRUMB_SPECS) {
    const params = matchPattern(spec.pattern, normalizedPathname);

    if (!params) {
      continue;
    }

    const context: BreadcrumbContext = {
      pathname: normalizedPathname,
      params,
    };
    const resolvedItems = typeof spec.items === "function" ? spec.items(context) : spec.items;
    const specificity = getPatternSpecificity(spec.pattern);

    if (!bestMatch || specificity > bestMatch.specificity) {
      bestMatch = {
        specificity,
        items: resolvedItems,
      };
    }
  }

  const items = bestMatch?.items ?? buildFallbackBreadcrumbs(normalizedPathname);

  return items.filter((item, index, array) => {
    if (!item.label.trim()) return false;
    if (index === 0) return true;

    const previous = array[index - 1];
    return previous.label !== item.label || previous.href !== item.href;
  });
}
