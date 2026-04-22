import { ROUTES } from "@/lib/routes";

export type CustomerNavIconName =
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
      label: "Tài khoản",
      iconName: "user",
      defaultOpen: false,
      children: [
        { label: "Hồ sơ", href: ROUTES.CUSTOMER.PROFILE, iconName: "user" },
        { label: "Tiếp thị liên kết", href: ROUTES.CUSTOMER.AFFILIATE, iconName: "badge-percent" },
      ],
    },
    {
      type: "group",
      label: "Hệ thống",
      iconName: "settings",
      defaultOpen: false,
      children: [{ label: "Cài đặt", href: ROUTES.CUSTOMER.SETTINGS, iconName: "settings" }],
    },
  ];
}

export const CUSTOMER_MOBILE_NAV: CustomerMobileNavEntry[] = [
  { label: "Dashboard", href: ROUTES.CUSTOMER.DASHBOARD, iconName: "layout-dashboard" },
  { label: "Thiệp của tôi", href: ROUTES.CUSTOMER.INVITATIONS, iconName: "folder-heart" },
  { label: "Đơn hàng", href: ROUTES.CUSTOMER.ORDERS, iconName: "shopping-bag" },
  { label: "Tin nhắn", href: ROUTES.CUSTOMER.MESSAGES, iconName: "message-circle" },
  { label: "Hồ sơ", href: ROUTES.CUSTOMER.PROFILE, iconName: "user" },
  { label: "Affiliate", href: ROUTES.CUSTOMER.AFFILIATE, iconName: "badge-percent" },
  { label: "Cài đặt", href: ROUTES.CUSTOMER.SETTINGS, iconName: "settings" },
];
