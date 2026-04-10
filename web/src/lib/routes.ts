/**
 * Centralized routing configuration.
 * All internal links and redirect paths should reference this object.
 */
export const ROUTES = {
  HOME: "/",
  ABOUT: "/about",
  CONTACT: "/contact",
  TEMPLATES: "/templates",
  BUILDER: "/builder",
  SERVICES: "/services",
  TOOLS: "/tools",
  BLOG: "/blog",
  SITEMAP_XML: "/sitemap.xml",
  ROBOTS_TXT: "/robots.txt",
  SITEMAP: {
    INDEX: "/sitemap.xml",
    PAGES: "/sitemap-pages.xml",
    BLOG_CATEGORIES: "/sitemap-blog-categories.xml",
    BLOG_POSTS: "/sitemap-blog-posts.xml",
    PRODUCTS: "/sitemap-products.xml",
    INVITATIONS: "/sitemap-invitations.xml",
  },
  CATALOG: {
    TEMPLATE: (slug: string) => `/templates/${slug}`,
    BUILDER: (slug: string) => `/builder/${slug}`,
  },
  INVITATIONS: {
    PUBLIC: (slug: string) => `/invitations/${slug}`,
    DASHBOARD: "/user/invitations",
    EDITOR: (id: string) => `/user/invitations/${id}`,
    API: {
      CREATE_FROM_PRODUCT: "/api/user/invitations/create-from-product",
      CREATE_BUILDER: "/api/user/invitations/create-builder",
      UPDATE: "/api/user/invitations/update",
    },
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
    ROOT: "/user",
    DASHBOARD: "/user/dashboard",
    PROFILE: "/user/profile",
    SETTINGS: "/user/settings",
    AFFILIATE: "/user/affiliate",
    INVITATIONS: "/user/invitations",
    DESIGN: (id: string) => `/user/design/${id}`,
  },
  ADMIN: {
    ROOT: "/admin",
    LOGIN: "/admin/login",
    DASHBOARD: "/admin/dashboard",
    PAGES: "/admin/pages",
    BLOG_POSTS: "/admin/blog/posts",
    BLOG_POST: (slug: string) => `/admin/blog/posts/${slug}`,
    BLOG_CATEGORIES: "/admin/blog/categories",
    BLOG_CATEGORY: (slug: string) => `/admin/blog/categories/${slug}`,
    MENUS: "/admin/menus",
    MENU: (id: string) => `/admin/menus/${id}`,
    SEO_GUIDE: "/admin/seo-guide",
    SEO_PAGES: "/admin/seo/pages",
    SEO_SCHEMA: "/admin/seo/schema",
    SEO_RULES: "/admin/seo/rules",
    CONFIG: "/admin/config",
    CONFIG_COMMERCE: "/admin/config/commerce",
    CONFIG_PERMALINKS: "/admin/config/permalinks",
    CONFIG_BREADCRUMBS: "/admin/config/breadcrumbs",
    CONFIG_SITEMAP: "/admin/config/sitemap",
    PRODUCTS: "/admin/products",
    PRODUCT_LIST: "/admin/products/list",
    PRODUCT_CATEGORIES: "/admin/products/categories",
    PRODUCT_CATEGORY: (slug: string) => `/admin/products/categories/${slug}`,
    PRODUCT: (slug: string) => `/admin/products/${slug}`,
    USERS: "/admin/users",
    USERS_CREATE: "/admin/users/create",
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
      BLOG: {
        POSTS: {
          CREATE: "/api/admin/blog/posts/create",
          UPDATE: "/api/admin/blog/posts/update",
          DELETE: "/api/admin/blog/posts/delete",
        },
        CATEGORIES: {
          CREATE: "/api/admin/blog/categories/create",
          UPDATE: "/api/admin/blog/categories/update",
          DELETE: "/api/admin/blog/categories/delete",
        },
      },
      PAGES: {
        UPDATE: "/api/admin/pages/update",
        BULK: "/api/admin/pages/bulk",
      },
      CONFIG: {
        UPDATE: "/api/admin/config/update",
      },
      MENUS: {
        UPDATE: "/api/admin/menus/update",
      },
      AFFILIATES: {
        UPDATE: "/api/admin/affiliates/update",
        BULK: "/api/admin/affiliates/bulk",
      },
      USERS: {
        CREATE: "/api/admin/users/create",
        UPDATE: "/api/admin/users/update",
        DELETE: "/api/admin/users/delete",
        ROLE: "/api/admin/users/role",
        BULK: "/api/admin/users/bulk",
      },
      PRODUCTS: {
        CATEGORIES: {
          CREATE: "/api/admin/products/categories/create",
          UPDATE: "/api/admin/products/categories/update",
          DELETE: "/api/admin/products/categories/delete",
          BULK: "/api/admin/products/categories/bulk",
        },
        CREATE: "/api/admin/products/create",
        UPDATE: "/api/admin/products/update",
        DELETE: "/api/admin/products/delete",
        BULK: "/api/admin/products/bulk",
      },
    },
    USER: {
      PROFILE: "/api/user/profile",
      AFFILIATE: {
        APPLY: "/api/user/affiliate/apply",
      },
      INVITATIONS: {
        CREATE_FROM_PRODUCT: "/api/user/invitations/create-from-product",
        CREATE_BUILDER: "/api/user/invitations/create-builder",
        UPDATE: "/api/user/invitations/update",
      },
    },
    AFFILIATE: {
      TRACK: "/api/affiliate/track",
    },
    MEDIA: "/api/media",
  },
} as const;
