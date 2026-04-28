import { ROUTES } from "@/lib/routes";

export type CustomerNavIconName =
  | "map-pin"
  | "folder-heart"
  | "shopping-bag"
  | "message-circle"
  | "user"
  | "badge-percent"
  | "settings";

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
  iconName: CustomerNavIconName | "layout-dashboard" | "store";
};

export function getCustomerNavGroups(): CustomerNavEntry[] {
  return [
    {
      type: "group",
      label: "Đơn hàng",
      iconName: "shopping-bag",
      defaultOpen: false,
      children: [{ label: "Đơn hàng của tôi", href: ROUTES.CUSTOMER.ORDERS, iconName: "shopping-bag" }],
    },
    {
      type: "link",
      label: "Tin nhắn",
      href: ROUTES.CUSTOMER.MESSAGES,
      iconName: "message-circle",
    },
    {
      type: "group",
      label: "Thiệp",
      iconName: "folder-heart",
      defaultOpen: false,
      children: [{ label: "Thiệp của tôi", href: ROUTES.CUSTOMER.INVITATIONS, iconName: "folder-heart" }],
    },
    {
      type: "group",
      label: "Configs",
      iconName: "user",
      defaultOpen: false,
      children: [
        { label: "Tổng quan configs", href: ROUTES.CUSTOMER.CONFIG, iconName: "settings" },
        { label: "Hồ sơ", href: ROUTES.CUSTOMER.CONFIG_PROFILE, iconName: "user" },
        { label: "Cấu hình địa chỉ", href: ROUTES.CUSTOMER.CONFIG_ADDRESSES, iconName: "map-pin" },
        { label: "Cài đặt", href: ROUTES.CUSTOMER.CONFIG_SETTINGS, iconName: "settings" },
        { label: "Tiếp thị liên kết", href: ROUTES.CUSTOMER.AFFILIATE, iconName: "badge-percent" },
      ],
    },
  ];
}

export const CUSTOMER_MOBILE_NAV: CustomerMobileNavEntry[] = [
  { label: "Dashboard", href: ROUTES.CUSTOMER.DASHBOARD, iconName: "layout-dashboard" },
  { label: "Thiệp của tôi", href: ROUTES.CUSTOMER.INVITATIONS, iconName: "folder-heart" },
  { label: "Đơn hàng", href: ROUTES.CUSTOMER.ORDERS, iconName: "shopping-bag" },
  { label: "Tin nhắn", href: ROUTES.CUSTOMER.MESSAGES, iconName: "message-circle" },
  { label: "Configs", href: ROUTES.CUSTOMER.CONFIG, iconName: "settings" },
  { label: "Địa chỉ", href: ROUTES.CUSTOMER.CONFIG_ADDRESSES, iconName: "map-pin" },
  { label: "Affiliate", href: ROUTES.CUSTOMER.AFFILIATE, iconName: "badge-percent" },
  { label: "Cài đặt", href: ROUTES.CUSTOMER.CONFIG_SETTINGS, iconName: "settings" },
];
