import { ROUTES } from "@/lib/routes";

export type ProviderNavIconName =
  | "calendar-clock"
  | "layout-dashboard"
  | "messages-square"
  | "map-pin"
  | "package-check"
  | "package-plus"
  | "package-search"
  | "settings"
  | "shopping-bag"
  | "store"
  | "user"
  | "external-link";

export type ProviderNavLinkEntry = {
  type: "link";
  key: string;
  label: string;
  description?: string;
  href: string;
  iconName: ProviderNavIconName;
  exact?: boolean;
  matchPrefixes?: string[];
  excludePaths?: string[];
  excludePrefixes?: string[];
};

export type ProviderNavChild = Omit<ProviderNavLinkEntry, "type">;

export type ProviderNavGroupEntry = {
  type: "group";
  key: string;
  label: string;
  description: string;
  href: string;
  iconName: ProviderNavIconName;
  children: ProviderNavChild[];
  defaultOpen?: boolean;
  matchPrefixes?: string[];
  excludePaths?: string[];
  excludePrefixes?: string[];
};

export type ProviderNavEntry = ProviderNavGroupEntry | ProviderNavLinkEntry;

const providerOrderPrefix = ROUTES.PROVIDER.ORDER("").slice(0, -1);
const providerOfferingPrefix = ROUTES.PROVIDER.OFFERING("").slice(0, -1);

export const PROVIDER_NAV_PRIMARY_ITEMS: ProviderNavLinkEntry[] = [
  {
    type: "link",
    key: "dashboard",
    label: "Dashboard",
    description: "Tổng quan vận hành provider.",
    href: ROUTES.PROVIDER.DASHBOARD,
    iconName: "layout-dashboard",
    exact: true,
  },
];

export const PROVIDER_NAV_GROUPS: ProviderNavGroupEntry[] = [
  {
    type: "group",
    key: "work",
    label: "Đơn & booking",
    description: "Booking, đơn hàng được giao và lead báo giá.",
    href: ROUTES.PROVIDER.WORK,
    iconName: "shopping-bag",
    defaultOpen: true,
    matchPrefixes: [ROUTES.PROVIDER.WORK, ROUTES.PROVIDER.BOOKINGS, ROUTES.PROVIDER.ORDERS, providerOrderPrefix, ROUTES.PROVIDER.LEADS],
    children: [
      {
        key: "bookings",
        label: "Booking dịch vụ",
        description: "Theo dõi booking dịch vụ và cập nhật trạng thái nhận việc.",
        href: ROUTES.PROVIDER.BOOKINGS,
        iconName: "calendar-clock",
        matchPrefixes: [ROUTES.PROVIDER.BOOKINGS],
      },
      {
        key: "orders",
        label: "Đơn được giao",
        description: "Quản lý đơn hàng provider đang được phân công xử lý.",
        href: ROUTES.PROVIDER.ORDERS,
        iconName: "package-search",
        matchPrefixes: [ROUTES.PROVIDER.ORDERS, providerOrderPrefix],
      },
      {
        key: "leads",
        label: "Leads & báo giá",
        description: "Theo dõi lead và yêu cầu báo giá từ khách hàng.",
        href: ROUTES.PROVIDER.LEADS,
        iconName: "package-search",
        matchPrefixes: [ROUTES.PROVIDER.LEADS],
      },
    ],
  },
  {
    type: "group",
    key: "services",
    label: "Dịch vụ",
    description: "Dịch vụ/sản phẩm provider cung cấp, cơ hội cần provider và bảng giá.",
    href: ROUTES.PROVIDER.SERVICES,
    iconName: "package-check",
    defaultOpen: false,
    matchPrefixes: [
      ROUTES.PROVIDER.SERVICES,
      ROUTES.PROVIDER.OFFERINGS,
      providerOfferingPrefix,
      ROUTES.PROVIDER.AVAILABLE_TEMPLATES,
      ROUTES.PROVIDER.SUPPLY_REQUESTS,
      ROUTES.PROVIDER.PRICING,
    ],
    children: [
      {
        key: "offerings",
        label: "Dịch vụ/sản phẩm của tôi",
        description: "Gửi và theo dõi yêu cầu dịch vụ hoặc sản phẩm provider muốn cung cấp.",
        href: ROUTES.PROVIDER.OFFERINGS,
        iconName: "package-plus",
        matchPrefixes: [ROUTES.PROVIDER.OFFERINGS, providerOfferingPrefix],
      },
      {
        key: "available-templates",
        label: "Dịch vụ cần provider",
        description: "Xem nhu cầu sourcing đang mở từ hệ thống.",
        href: ROUTES.PROVIDER.AVAILABLE_TEMPLATES,
        iconName: "package-check",
        matchPrefixes: [ROUTES.PROVIDER.AVAILABLE_TEMPLATES],
      },
      {
        key: "supply-requests",
        label: "Yêu cầu đã gửi",
        description: "Theo dõi yêu cầu provider đã gửi để tham gia cung ứng.",
        href: ROUTES.PROVIDER.SUPPLY_REQUESTS,
        iconName: "package-check",
        matchPrefixes: [ROUTES.PROVIDER.SUPPLY_REQUESTS],
      },
      {
        key: "pricing",
        label: "Bảng giá",
        description: "Cập nhật gói giá và điều kiện cung cấp dịch vụ.",
        href: ROUTES.PROVIDER.PRICING,
        iconName: "package-check",
        matchPrefixes: [ROUTES.PROVIDER.PRICING],
      },
    ],
  },
  {
    type: "group",
    key: "profile",
    label: "Hồ sơ & lịch",
    description: "Hồ sơ hiển thị, khu vực phục vụ, lịch khả dụng và review.",
    href: ROUTES.PROVIDER.PROFILE,
    iconName: "user",
    defaultOpen: false,
    matchPrefixes: [
      ROUTES.PROVIDER.PROFILE,
      ROUTES.PROVIDER.PORTFOLIO,
      ROUTES.PROVIDER.REGIONS,
      ROUTES.PROVIDER.AVAILABILITY,
      ROUTES.PROVIDER.REVIEWS,
    ],
    children: [
      {
        key: "portfolio",
        label: "Portfolio",
        description: "Quản lý hồ sơ năng lực, hình ảnh và nội dung giới thiệu.",
        href: ROUTES.PROVIDER.PORTFOLIO,
        iconName: "package-check",
        matchPrefixes: [ROUTES.PROVIDER.PORTFOLIO],
      },
      {
        key: "regions",
        label: "Khu vực phục vụ",
        description: "Khai báo khu vực provider nhận phục vụ.",
        href: ROUTES.PROVIDER.REGIONS,
        iconName: "map-pin",
        matchPrefixes: [ROUTES.PROVIDER.REGIONS],
      },
      {
        key: "availability",
        label: "Lịch khả dụng",
        description: "Khai báo khung giờ có thể nhận booking.",
        href: ROUTES.PROVIDER.AVAILABILITY,
        iconName: "calendar-clock",
        matchPrefixes: [ROUTES.PROVIDER.AVAILABILITY],
      },
      {
        key: "reviews",
        label: "Đánh giá",
        description: "Theo dõi đánh giá khách hàng dành cho provider.",
        href: ROUTES.PROVIDER.REVIEWS,
        iconName: "messages-square",
        matchPrefixes: [ROUTES.PROVIDER.REVIEWS],
      },
    ],
  },
  {
    type: "group",
    key: "account",
    label: "Tài khoản & tổ chức",
    description: "Tài khoản đăng nhập, địa chỉ và thông tin tổ chức vận hành.",
    href: ROUTES.PROVIDER.CONFIG,
    iconName: "user",
    defaultOpen: false,
    matchPrefixes: [ROUTES.PROVIDER.CONFIG, ROUTES.PROVIDER.ORGANIZATION],
    children: [
      {
        key: "provider-account",
        label: "Tài khoản provider",
        description: "Thông tin cửa hàng, email vận hành và dữ liệu định danh.",
        href: ROUTES.PROVIDER.CONFIG_ACCOUNT,
        iconName: "user",
        matchPrefixes: [ROUTES.PROVIDER.CONFIG_ACCOUNT],
      },
      {
        key: "addresses",
        label: "Địa chỉ",
        description: "Quản lý địa chỉ dùng cho giao nhận, lấy hàng và hoàn hàng.",
        href: ROUTES.PROVIDER.CONFIG_ADDRESSES,
        iconName: "map-pin",
        matchPrefixes: [ROUTES.PROVIDER.CONFIG_ADDRESSES],
        excludePaths: [ROUTES.PROVIDER.CONFIG_ADDRESS_NEW],
      },
      {
        key: "organization",
        label: "Tổ chức",
        description: "Quản lý thông tin pháp nhân hoặc đội ngũ vận hành.",
        href: ROUTES.PROVIDER.ORGANIZATION,
        iconName: "user",
        matchPrefixes: [ROUTES.PROVIDER.ORGANIZATION],
      },
    ],
  },
];

export const PROVIDER_NAV_SECONDARY_ITEMS: ProviderNavLinkEntry[] = [
  {
    type: "link",
    key: "priority",
    label: "Ưu tiên hiển thị",
    description: "Theo dõi gói nổi bật, placement và hiệu quả hiển thị.",
    href: ROUTES.PROVIDER.PRIORITY,
    iconName: "package-check",
    exact: true,
  },
  {
    type: "link",
    key: "messages",
    label: "Tin nhắn",
    description: "Trao đổi với khách hàng và bộ phận vận hành.",
    href: ROUTES.PROVIDER.MESSAGES,
    iconName: "messages-square",
    exact: true,
  },
];

export const PROVIDER_NAV_AUXILIARY_ITEMS: ProviderNavLinkEntry[] = [
  {
    type: "link",
    key: "customer-dashboard",
    label: "Khu khách hàng",
    description: "Quay về dashboard customer của cùng tài khoản.",
    href: ROUTES.CUSTOMER.DASHBOARD,
    iconName: "store",
  },
  {
    type: "link",
    key: "website",
    label: "Xem Website",
    description: "Quay về website public.",
    href: ROUTES.HOME,
    iconName: "external-link",
  },
];

export function getProviderNavItems(): ProviderNavEntry[] {
  return [...PROVIDER_NAV_PRIMARY_ITEMS, ...PROVIDER_NAV_GROUPS, ...PROVIDER_NAV_SECONDARY_ITEMS];
}

export function getProviderNavGroup(key: string) {
  return PROVIDER_NAV_GROUPS.find((group) => group.key === key);
}
