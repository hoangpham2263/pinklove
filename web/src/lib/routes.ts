/**
 * Centralized routing configuration.
 * All internal links and redirect paths should reference this object.
 */
export const ROUTES = {
  HOME: "/",
  TEMPLATES: "/templates",
  BUILDER: "/builder",
  WEDDING: {
    TEMPLATE: (slug: string) => `/templates/${slug}`,
    BUILDER: (slug: string) => `/builder/${slug}`,
    SITE: (slug: string) => `/w/${slug}`,
  },
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
    SITES: "/user/sites",
    DESIGN: (id: string) => `/user/design/${id}`,
  },
  ADMIN: {
    LOGIN: "/admin/login",
    DASHBOARD: "/admin/dashboard",
    SETTINGS: "/admin/settings",
    PRODUCTS: "/admin/products",
    PRODUCT: (slug: string) => `/admin/products/${slug}`,
    USER: "/admin/user",
    MEDIA: "/admin/media",
    AFFILIATES: "/admin/affiliates",
  },
  API: {
    USER: {
      SITES: {
        CREATE_FROM_PRODUCT: "/api/user/sites/create-from-product",
        CREATE_BUILDER: "/api/user/sites/create-builder",
        UPDATE: "/api/user/sites/update",
      },
    },
    ADMIN: {
      PRODUCTS: {
        CREATE: "/api/admin/products/create",
        UPDATE: "/api/admin/products/update",
        DELETE: "/api/admin/products/delete",
      },
    },
  },
} as const;
