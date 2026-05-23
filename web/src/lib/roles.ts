export const USER_ROLES = {
  ADMIN: "ADMIN",
  CUSTOMER: "CUSTOMER",
  AFFILIATE: "AFFILIATE",
  PROVIDER: "PROVIDER",
} as const;

export const ACTOR_CODES = {
  ...USER_ROLES,
  GUEST: "GUEST",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export type ActorCode = (typeof ACTOR_CODES)[keyof typeof ACTOR_CODES];

export const USER_ROLE_OPTIONS = [
  { value: USER_ROLES.ADMIN, label: "Quản trị viên", description: "Quyền quản trị toàn hệ thống." },
  { value: USER_ROLES.CUSTOMER, label: "Khách hàng", description: "Khách mua dịch vụ hoặc thành viên sử dụng hệ thống." },
  { value: USER_ROLES.AFFILIATE, label: "Đối tác / CTV", description: "Đối tác tiếp thị liên kết và giới thiệu khách." },
  { value: USER_ROLES.PROVIDER, label: "Xưởng in / Nhà cung cấp", description: "Đơn vị đối tác cung ứng sản phẩm hoặc dịch vụ." },
] as const;

export function getRoleLabel(role: UserRole | ActorCode): string {
  switch (role) {
    case ACTOR_CODES.ADMIN:
      return "Quản trị viên";
    case ACTOR_CODES.CUSTOMER:
      return "Khách hàng";
    case ACTOR_CODES.AFFILIATE:
      return "Đối tác / CTV";
    case ACTOR_CODES.PROVIDER:
      return "Xưởng in / Nhà cung cấp";
    case ACTOR_CODES.GUEST:
      return "Khách truy cập";
    default:
      return String(role);
  }
}

export function getRoleDescription(role: UserRole | ActorCode): string {
  switch (role) {
    case ACTOR_CODES.ADMIN:
      return "Tài khoản quản trị toàn bộ hệ thống.";
    case ACTOR_CODES.CUSTOMER:
      return "Người dùng mua dịch vụ hoặc quản lý sản phẩm của họ.";
    case ACTOR_CODES.AFFILIATE:
      return "Đối tác tiếp thị, cộng tác viên giới thiệu khách.";
    case ACTOR_CODES.PROVIDER:
      return "Đơn vị cung ứng, xưởng in hoặc nhà cung cấp đối tác.";
    case ACTOR_CODES.GUEST:
      return "Người truy cập công khai, chưa đăng nhập.";
    default:
      return String(role);
  }
}

export function parseUserRole(value: string | null | undefined, fallback: UserRole = USER_ROLES.CUSTOMER): UserRole {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === USER_ROLES.ADMIN) return USER_ROLES.ADMIN;
  if (normalized === USER_ROLES.CUSTOMER) return USER_ROLES.CUSTOMER;
  if (normalized === USER_ROLES.AFFILIATE) return USER_ROLES.AFFILIATE;
  if (normalized === USER_ROLES.PROVIDER) return USER_ROLES.PROVIDER;
  return fallback;
}

export function isAdminRole(role: string | null | undefined): role is typeof USER_ROLES.ADMIN {
  return parseUserRole(role, USER_ROLES.CUSTOMER) === USER_ROLES.ADMIN;
}

export function isAffiliateRole(role: string | null | undefined): role is typeof USER_ROLES.AFFILIATE {
  return parseUserRole(role, USER_ROLES.CUSTOMER) === USER_ROLES.AFFILIATE;
}

export function isProviderRole(role: string | null | undefined): role is typeof USER_ROLES.PROVIDER {
  return parseUserRole(role, USER_ROLES.CUSTOMER) === USER_ROLES.PROVIDER;
}

export function canAccessUserPortal(role: string | null | undefined): boolean {
  const parsed = parseUserRole(role, USER_ROLES.CUSTOMER);
  return parsed === USER_ROLES.CUSTOMER || parsed === USER_ROLES.AFFILIATE || parsed === USER_ROLES.PROVIDER;
}
