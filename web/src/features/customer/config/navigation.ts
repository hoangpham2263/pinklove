import { ROUTES } from "@/lib/routes";

export type CustomerNavIconName =
  | "folder-heart"
  | "shopping-bag"
  | "user"
  | "badge-percent"
  | "settings";

export type CustomerNavChild = {
  label: string;
  href: string;
  iconName: CustomerNavIconName;
};

export type CustomerNavGroup = {
  label: string;
  iconName: CustomerNavIconName;
  children: CustomerNavChild[];
  defaultOpen?: boolean;
};

export type CustomerMobileNavEntry = {
  label: string;
  href: string;
  iconName: CustomerNavIconName | "layout-dashboard" | "store";
};

export function getCustomerNavGroups(): CustomerNavGroup[] {
  return [
    {
      label: "Đơn hàng",
      iconName: "shopping-bag",
      defaultOpen: false,
      children: [{ label: "Đơn hàng của tôi", href: ROUTES.CUSTOMER.ORDERS, iconName: "shopping-bag" }],
    },
    {
      label: "Thiệp",
      iconName: "folder-heart",
      defaultOpen: false,
      children: [{ label: "Thiệp của tôi", href: ROUTES.CUSTOMER.INVITATIONS, iconName: "folder-heart" }],
    },
    {
      label: "Tài khoản",
      iconName: "user",
      defaultOpen: false,
      children: [
        { label: "Hồ sơ", href: ROUTES.CUSTOMER.PROFILE, iconName: "user" },
        { label: "Tiếp thị liên kết", href: ROUTES.CUSTOMER.AFFILIATE, iconName: "badge-percent" },
      ],
    },
    {
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
  { label: "Hồ sơ", href: ROUTES.CUSTOMER.PROFILE, iconName: "user" },
  { label: "Affiliate", href: ROUTES.CUSTOMER.AFFILIATE, iconName: "badge-percent" },
  { label: "Cài đặt", href: ROUTES.CUSTOMER.SETTINGS, iconName: "settings" },
];
