import { ROUTES } from "@/lib/routes";

export type CustomerNavIconName =
  | "layout-dashboard"
  | "map-pin"
  | "folder-heart"
  | "shopping-bag"
  | "message-circle"
  | "user"
  | "badge-percent"
  | "link"
  | "settings"
  | "store"
  | "external-link";

export type CustomerNavChild = {
  label: string;
  href: string;
  iconName: CustomerNavIconName;
};

export type CustomerNavGroupEntry = {
  type: "group";
  label: string;
  iconName: CustomerNavIconName;
  children: CustomerNavChild[];
  defaultOpen?: boolean;
};

export type CustomerNavLinkEntry = {
  type: "link";
  label: string;
  href: string;
  iconName: CustomerNavIconName;
};

export type CustomerNavEntry = CustomerNavGroupEntry | CustomerNavLinkEntry;

export type CustomerMobileNavEntry = {
  label: string;
  href: string;
  iconName: CustomerNavIconName;
};

export const CUSTOMER_NAV_PRIMARY_ITEMS: CustomerNavLinkEntry[] = [
  {
    type: "link",
    label: "Dashboard",
    href: ROUTES.CUSTOMER.DASHBOARD,
    iconName: "layout-dashboard",
  },
  {
    type: "link",
    label: "Tin nhắn",
    href: ROUTES.CUSTOMER.MESSAGES,
    iconName: "message-circle",
  },
];

export const CUSTOMER_NAV_GROUPS: CustomerNavGroupEntry[] = [
  {
    type: "group",
    label: "Workspace",
    iconName: "folder-heart",
    defaultOpen: false,
    children: [
      { label: "Thiệp của tôi", href: ROUTES.CUSTOMER.INVITATIONS, iconName: "folder-heart" },
      { label: "Đơn hàng", href: ROUTES.CUSTOMER.ORDERS, iconName: "shopping-bag" },
    ],
  },
  {
    type: "group",
    label: "Tài khoản",
    iconName: "user",
    defaultOpen: false,
    children: [
      { label: "Hồ sơ", href: ROUTES.CUSTOMER.CONFIG_PROFILE, iconName: "user" },
      { label: "Sổ địa chỉ", href: ROUTES.CUSTOMER.CONFIG_ADDRESSES, iconName: "map-pin" },
      { label: "Thêm địa chỉ", href: ROUTES.CUSTOMER.CONFIG_ADDRESS_NEW, iconName: "map-pin" },
    ],
  },
  {
    type: "group",
    label: "Affiliate",
    iconName: "badge-percent",
    defaultOpen: false,
    children: [
      { label: "Tổng quan affiliate", href: ROUTES.CUSTOMER.AFFILIATE, iconName: "badge-percent" },
      { label: "Tạo link affiliate", href: ROUTES.CUSTOMER.AFFILIATE_LINKS, iconName: "link" },
    ],
  },
  {
    type: "group",
    label: "Vendor",
    iconName: "store",
    defaultOpen: false,
    children: [
      { label: "Nhà cung cấp", href: ROUTES.CUSTOMER.VENDOR, iconName: "store" },
    ],
  },
];

export const CUSTOMER_NAV_SECONDARY_ITEMS: CustomerNavLinkEntry[] = [
  {
    type: "link",
    label: "Cấu hình",
    href: ROUTES.CUSTOMER.CONFIG,
    iconName: "settings",
  },
];

export const CUSTOMER_NAV_AUXILIARY_ITEMS: CustomerNavLinkEntry[] = [
  {
    type: "link",
    label: "Xem Website",
    href: ROUTES.HOME,
    iconName: "external-link",
  },
];

export function getCustomerNavGroups(): CustomerNavEntry[] {
  return [...CUSTOMER_NAV_GROUPS, ...CUSTOMER_NAV_SECONDARY_ITEMS];
}

export const CUSTOMER_MOBILE_NAV: CustomerMobileNavEntry[] = [
  ...CUSTOMER_NAV_PRIMARY_ITEMS.map((item) => ({
    label: item.label,
    href: item.href,
    iconName: item.iconName,
  })),
  ...CUSTOMER_NAV_GROUPS.flatMap((group) =>
    group.children.map((item) => ({
      label: item.label,
      href: item.href,
      iconName: item.iconName,
    }))
  ),
  ...CUSTOMER_NAV_SECONDARY_ITEMS.map((item) => ({
    label: item.label,
    href: item.href,
    iconName: item.iconName,
  })),
];
