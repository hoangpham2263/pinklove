import { ROUTES } from "@/lib/routes";

export type ProviderNavIconName =
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
];

export const PROVIDER_NAV_GROUPS: ProviderNavGroupEntry[] = [
  {
    type: "group",
    label: "Vận hành",
    iconName: "shopping-bag",
    defaultOpen: false,
    children: [
      {
        label: "Đơn được giao",
        href: ROUTES.PROVIDER.ORDERS,
        iconName: "package-search",
        matchPrefixes: [ROUTES.PROVIDER.ORDERS, providerOrderPrefix],
      },
      {
        label: "Sản phẩm",
        href: ROUTES.PROVIDER.OFFERINGS,
        iconName: "package-plus",
        matchPrefixes: [ROUTES.PROVIDER.OFFERINGS, providerOfferingPrefix],
      },
      {
        label: "Tạo sản phẩm",
        href: ROUTES.PROVIDER.OFFERING_NEW,
        iconName: "package-plus",
        exact: true,
      },
      {
        label: "Mẫu có sẵn",
        href: ROUTES.PROVIDER.AVAILABLE_TEMPLATES,
        iconName: "package-check",
        matchPrefixes: [ROUTES.PROVIDER.AVAILABLE_TEMPLATES],
      },
      {
        label: "Yêu cầu cung ứng",
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
        label: "Sổ địa chỉ",
        href: ROUTES.PROVIDER.CONFIG_ADDRESSES,
        iconName: "map-pin",
        matchPrefixes: [ROUTES.PROVIDER.CONFIG_ADDRESSES],
      },
      {
        label: "Thêm địa chỉ",
        href: ROUTES.PROVIDER.CONFIG_ADDRESS_NEW,
        iconName: "map-pin",
        exact: true,
      },
    ],
  },
];

export const PROVIDER_NAV_SECONDARY_ITEMS: ProviderNavLinkEntry[] = [
  {
    type: "link",
    label: "Cấu hình",
    href: ROUTES.PROVIDER.CONFIG,
    iconName: "settings",
    exact: true,
  },
];

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
