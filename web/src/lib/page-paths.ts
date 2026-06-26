import { AUTH_PAGES } from "@/features/auth/page-registry";
import { listContentPageSlugs } from "@/features/pages/registry";
import { ROUTES } from "@/lib/routes";

export type PagePathLike = {
  slug: string;
};

const FIXED_PAGE_PATHS: Record<string, string> = {
  home: ROUTES.HOME,
  login: ROUTES.AUTH.LOGIN,
  register: ROUTES.AUTH.REGISTER,
  providers: ROUTES.PROVIDER.APPLY,
  affiliates: ROUTES.AFFILIATE_APPLY,
};
const RESERVED_EXACT_PATHS = new Set([
  "/customer",
  "/provider",
  "/admin-site",
  "/user-site",
  "/search",
  "/wishlist",
  "/checkout",
  "/sitemap.xml",
  "/robots.txt",
]);
const RESERVED_PREFIXES = [
  "/api",
  "/admin-site",
  "/user-site",
  "/customer",
  "/user",
  "/provider",
  "/checkout",
  "/offerings",
  "/paper",
  "/invitations",
] as const;
const RESERVED_BRANCH_PREFIXES = [
  `${ROUTES.BLOG}/`,
  `${ROUTES.TEMPLATES}/`,
  `${ROUTES.PAPER}/`,
] as const;

export function getDefaultPagePath(slug: string): string {
  if (slug in FIXED_PAGE_PATHS) {
    return FIXED_PAGE_PATHS[slug]!;
  }

  return `/${slug}`;
}

export function getManagedPagePath(page: PagePathLike): string {
  return getDefaultPagePath(page.slug);
}

export function isReservedPagePath(path: string): boolean {
  const normalizedPath = path === "/" ? path : path.replace(/\/+$/g, "") || "/";
  const knownManagedPaths = new Set(
    [...Object.keys(AUTH_PAGES), ...listContentPageSlugs()].map((slug) => getDefaultPagePath(slug))
  );

  if (knownManagedPaths.has(normalizedPath)) {
    return false;
  }

  if (RESERVED_EXACT_PATHS.has(normalizedPath)) {
    return true;
  }

  if (RESERVED_PREFIXES.some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`))) {
    return true;
  }

  return RESERVED_BRANCH_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix));
}

export function isPageExcludedFromSitemap(slug: string): boolean {
  return slug === "login" || slug === "register" || slug === "not-found";
}
