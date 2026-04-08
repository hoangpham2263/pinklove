/**
 * Centralized routing configuration.
 * All internal links and redirect paths should reference this object.
 */
export const ROUTES = {
  HOME: "/",
  ABOUT: "/about-us",
  CONTACT: "/contact",
  TEMPLATES: "/templates",
  BUILDER: "/builder",
  SERVICES: "/services",
  TOOLS: "/tools",
  BLOG: "/blog",
  WEDDING: {
    TEMPLATE: (slug: string) => `/templates/${slug}`,
    BUILDER: (slug: string) => `/builder/${slug}`,
    SITE: (slug: string) => `/w/${slug}`,
  },
  TOOLS_PAGES: {
    QR_BUILDER: "/tools/qr-builder",
    WEDDING_BUDGET: "/tools/wedding-budget",
  },
  BLOG_PAGES: {
    CATEGORY: (slug: string) => `/blog/${slug}`,
    POST: (slug: string) => `/blog/post/${slug}`,
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
    PAGES: "/admin/pages",
    MENUS: "/admin/menus",
    MENU: (id: string) => `/admin/menus/${id}`,
    SEO_GUIDE: "/admin/seo-guide",
    SETTINGS: "/admin/settings",
    PRODUCTS: "/admin/products",
    PRODUCT_LIST: "/admin/products/list",
    PRODUCT: (slug: string) => `/admin/products/${slug}`,
    USER: "/admin/user",
    MEDIA: "/admin/media",
    AFFILIATES: "/admin/affiliates",
  },
  API: {
    AUTH: {
      LOGIN: "/api/auth/login",
      REGISTER: "/api/auth/register",
      GOOGLE_LOGIN: "/api/auth/google/login",
      LOGOUT: "/api/auth/logout",
    },
    ADMIN: {
      AUTH: {
        LOGIN: "/api/admin/auth/login",
      },
      PAGES: {
        UPDATE: "/api/admin/pages/update",
      },
      MENUS: {
        UPDATE: "/api/admin/menus/update",
      },
      AFFILIATES: {
        UPDATE: "/api/admin/affiliates/update",
      },
      USERS: {
        CREATE: "/api/admin/users/create",
        UPDATE: "/api/admin/users/update",
        DELETE: "/api/admin/users/delete",
        ROLE: "/api/admin/users/role",
      },
      PRODUCTS: {
        CREATE: "/api/admin/products/create",
        UPDATE: "/api/admin/products/update",
        DELETE: "/api/admin/products/delete",
      },
    },
    USER: {
      PROFILE: "/api/user/profile",
      AFFILIATE: {
        APPLY: "/api/user/affiliate/apply",
      },
      SITES: {
        CREATE_FROM_PRODUCT: "/api/user/sites/create-from-product",
        CREATE_BUILDER: "/api/user/sites/create-builder",
        UPDATE: "/api/user/sites/update",
      },
    },
    MEDIA: "/api/media",
  },
} as const;
