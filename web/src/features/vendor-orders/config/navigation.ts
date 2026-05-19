import { ROUTES } from "@/lib/routes";

export type VendorNavIconName =
  | "layout-dashboard"
  | "map-pin"
  | "package-check"
  | "package-plus"
  | "package-search"
  | "settings"
  | "shopping-bag"
  | "user"
  | "external-link";

export type VendorNavLinkEntry = {
  type: "link";
  label: string;
  href: string;
  iconName: VendorNavIconName;
  exact?: boolean;
  matchPrefixes?: string[];
};

export type VendorNavChild = Omit<VendorNavLinkEntry, "type">;

export type VendorNavGroupEntry = {
  type: "group";
  label: string;
  iconName: VendorNavIconName;
  children: VendorNavChild[];
  defaultOpen?: boolean;
};

export type VendorNavEntry = VendorNavGroupEntry | VendorNavLinkEntry;

const partnerOrderPrefix = ROUTES.PARTNER.ORDER("").slice(0, -1);
const partnerProductPrefix = ROUTES.PARTNER.PRODUCT("").slice(0, -1);

export const VENDOR_NAV_PRIMARY_ITEMS: VendorNavLinkEntry[] = [
  {
    type: "link",
    label: "Dashboard",
    href: ROUTES.PARTNER.DASHBOARD,
    iconName: "layout-dashboard",
    exact: true,
  },
];

export const VENDOR_NAV_GROUPS: VendorNavGroupEntry[] = [
  {
    type: "group",
    label: "Vận hành",
    iconName: "shopping-bag",
    defaultOpen: false,
    children: [
      {
        label: "Đơn được giao",
        href: ROUTES.PARTNER.ORDERS,
        iconName: "package-search",
        matchPrefixes: [ROUTES.PARTNER.ORDERS, partnerOrderPrefix],
      },
      {
        label: "Sản phẩm",
        href: ROUTES.PARTNER.PRODUCTS,
        iconName: "package-plus",
        matchPrefixes: [ROUTES.PARTNER.PRODUCTS, partnerProductPrefix],
      },
      {
        label: "Tạo sản phẩm",
        href: ROUTES.PARTNER.PRODUCT_NEW,
        iconName: "package-plus",
        exact: true,
      },
      {
        label: "Mẫu có sẵn",
        href: ROUTES.PARTNER.AVAILABLE_TEMPLATES,
        iconName: "package-check",
        matchPrefixes: [ROUTES.PARTNER.AVAILABLE_TEMPLATES],
      },
      {
        label: "Yêu cầu cung ứng",
        href: ROUTES.PARTNER.SUPPLY_REQUESTS,
        iconName: "package-check",
        matchPrefixes: [ROUTES.PARTNER.SUPPLY_REQUESTS],
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
        label: "Tài khoản vendor",
        href: ROUTES.PARTNER.CONFIG_ACCOUNT,
        iconName: "user",
        matchPrefixes: [ROUTES.PARTNER.CONFIG_ACCOUNT],
      },
      {
        label: "Sổ địa chỉ",
        href: ROUTES.PARTNER.CONFIG_ADDRESSES,
        iconName: "map-pin",
        matchPrefixes: [ROUTES.PARTNER.CONFIG_ADDRESSES],
      },
      {
        label: "Thêm địa chỉ",
        href: ROUTES.PARTNER.CONFIG_ADDRESS_NEW,
        iconName: "map-pin",
        exact: true,
      },
    ],
  },
];

export const VENDOR_NAV_SECONDARY_ITEMS: VendorNavLinkEntry[] = [
  {
    type: "link",
    label: "Cấu hình",
    href: ROUTES.PARTNER.CONFIG,
    iconName: "settings",
    exact: true,
  },
];

export const VENDOR_NAV_AUXILIARY_ITEMS: VendorNavLinkEntry[] = [
  {
    type: "link",
    label: "Xem Website",
    href: ROUTES.HOME,
    iconName: "external-link",
  },
];

export function getVendorNavItems(): VendorNavEntry[] {
  return [...VENDOR_NAV_PRIMARY_ITEMS, ...VENDOR_NAV_GROUPS, ...VENDOR_NAV_SECONDARY_ITEMS];
}
