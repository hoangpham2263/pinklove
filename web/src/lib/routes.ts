/**
 * Centralized routing configuration.
 * All internal links and redirect paths should reference this object.
 */
export const ROUTES = {
  HOME: "/",
  AUTH: {
    LOGIN: "/user/login",
    REGISTER: "/user/register",
    LOGOUT_API: "/api/auth/logout",
  },
  USER: {
    DASHBOARD: "/user/dashboard",
    PROFILE: "/user/profile",
    SETTINGS: "/user/settings",
    AFFILIATE: "/user/affiliate",
  },
  ADMIN: {
    LOGIN: "/admin/login",
    DASHBOARD: "/admin/dashboard",
    SETTINGS: "/admin/settings",
    USER: "/admin/user",
    MEDIA: "/admin/media",
    AFFILIATES: "/admin/affiliates",
  },
} as const;
