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
  | "user"
  | "external-link";

export type ProviderNavLinkEntry = {
  type: "link";
  label: string;
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
  label: string;
  iconName: ProviderNavIconName;
  children: ProviderNavChild[];
  defaultOpen?: boolean;
};

export type ProviderNavEntry = ProviderNavGroupEntry | ProviderNavLinkEntry;

const providerOrderPrefix = ROUTES.PROVIDER.ORDER("").slice(0, -1);
const providerOfferingPrefix = ROUTES.PROVIDER.OFFERING("").slice(0, -1);

export const PROVIDER_NAV_PRIMARY_ITEMS: ProviderNavLinkEntry[] = [
  {
    type: "link",
    label: "Dashboard",
    href: ROUTES.PROVIDER.DASHBOARD,
    iconName: "layout-dashboard",
    exact: true,
  },
  {
    type: "link",
    label: "Tin nhắn",
    href: ROUTES.PROVIDER.MESSAGES,
    iconName: "messages-square",
    exact: true,
  },
  {
    type: "link",
    label: "Cấu hình",
    href: ROUTES.PROVIDER.CONFIG,
    iconName: "settings",
    exact: true,
  },
];

export const PROVIDER_NAV_GROUPS: ProviderNavGroupEntry[] = [
  {
    type: "group",
    label: "Công việc",
    iconName: "shopping-bag",
    defaultOpen: true,
    children: [
      {
        label: "Bookings",
        href: ROUTES.PROVIDER.BOOKINGS,
        iconName: "calendar-clock",
        matchPrefixes: [ROUTES.PROVIDER.BOOKINGS],
      },
      {
        label: "Đơn được giao",
        href: ROUTES.PROVIDER.ORDERS,
        iconName: "package-search",
        matchPrefixes: [ROUTES.PROVIDER.ORDERS, providerOrderPrefix],
      },
      {
        label: "Khách hàng tiềm năng",
        href: ROUTES.PROVIDER.LEADS,
        iconName: "package-search",
        matchPrefixes: [ROUTES.PROVIDER.LEADS],
      },
    ],
  },
  {
    type: "group",
    label: "Dịch vụ & hồ sơ",
    iconName: "package-check",
    defaultOpen: false,
    children: [
      {
        label: "Yêu cầu dịch vụ/sản phẩm",
        href: ROUTES.PROVIDER.OFFERINGS,
        iconName: "package-plus",
        matchPrefixes: [ROUTES.PROVIDER.OFFERINGS, providerOfferingPrefix],
      },
      {
        label: "Portfolio",
        href: ROUTES.PROVIDER.PORTFOLIO,
        iconName: "package-check",
        matchPrefixes: [ROUTES.PROVIDER.PORTFOLIO],
      },
      {
        label: "Pricing",
        href: ROUTES.PROVIDER.PRICING,
        iconName: "package-check",
        matchPrefixes: [ROUTES.PROVIDER.PRICING],
      },
      {
        label: "Regions",
        href: ROUTES.PROVIDER.REGIONS,
        iconName: "map-pin",
        matchPrefixes: [ROUTES.PROVIDER.REGIONS],
      },
      {
        label: "Lịch khả dụng",
        href: ROUTES.PROVIDER.AVAILABILITY,
        iconName: "calendar-clock",
        matchPrefixes: [ROUTES.PROVIDER.AVAILABILITY],
      },
      {
        label: "Reviews",
        href: ROUTES.PROVIDER.REVIEWS,
        iconName: "messages-square",
        matchPrefixes: [ROUTES.PROVIDER.REVIEWS],
      },
    ],
  },
  {
    type: "group",
    label: "Nguồn cung",
    iconName: "package-plus",
    defaultOpen: false,
    children: [
      {
        label: "Dịch vụ/sản phẩm cần provider",
        href: ROUTES.PROVIDER.AVAILABLE_TEMPLATES,
        iconName: "package-check",
        matchPrefixes: [ROUTES.PROVIDER.AVAILABLE_TEMPLATES],
      },
      {
        label: "Yêu cầu cung cấp",
        href: ROUTES.PROVIDER.SUPPLY_REQUESTS,
        iconName: "package-check",
        matchPrefixes: [ROUTES.PROVIDER.SUPPLY_REQUESTS],
      },
    ],
  },
  {
    type: "group",
    label: "Tài khoản",
    iconName: "user",
    defaultOpen: false,
    children: [
      {
        label: "Tài khoản provider",
        href: ROUTES.PROVIDER.CONFIG_ACCOUNT,
        iconName: "user",
        matchPrefixes: [ROUTES.PROVIDER.CONFIG_ACCOUNT],
      },
      {
        label: "Địa chỉ",
        href: ROUTES.PROVIDER.CONFIG_ADDRESSES,
        iconName: "map-pin",
        matchPrefixes: [ROUTES.PROVIDER.CONFIG_ADDRESSES],
        excludePaths: [ROUTES.PROVIDER.CONFIG_ADDRESS_NEW],
      },
      {
        label: "Tổ chức",
        href: ROUTES.PROVIDER.ORGANIZATION,
        iconName: "user",
        matchPrefixes: [ROUTES.PROVIDER.ORGANIZATION],
      },
    ],
  },
];

export const PROVIDER_NAV_SECONDARY_ITEMS: ProviderNavLinkEntry[] = [];

export const PROVIDER_NAV_AUXILIARY_ITEMS: ProviderNavLinkEntry[] = [
  {
    type: "link",
    label: "Xem Website",
    href: ROUTES.HOME,
    iconName: "external-link",
  },
];

export function getProviderNavItems(): ProviderNavEntry[] {
  return [...PROVIDER_NAV_PRIMARY_ITEMS, ...PROVIDER_NAV_GROUPS, ...PROVIDER_NAV_SECONDARY_ITEMS];
}
