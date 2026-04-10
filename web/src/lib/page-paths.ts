export type PagePathLike = {
  slug: string;
  permalink?: string | null;
};

const RESERVED_PREFIXES = ["/api", "/admin", "/user"];

export function getDefaultPagePath(slug: string): string {
  if (slug === "home") {
    return "/";
  }

  if (slug === "login" || slug === "register") {
    return `/user/${slug}`;
  }

  return `/${slug}`;
}

export function canCustomizePagePermalink(slug: string): boolean {
  return slug !== "home" && slug !== "login" && slug !== "register" && slug !== "not-found";
}

export function normalizePagePermalinkInput(input: string | null | undefined, slug: string): string {
  if (!canCustomizePagePermalink(slug)) {
    return getDefaultPagePath(slug);
  }

  const fallback = getDefaultPagePath(slug);
  const rawValue = (input ?? "").trim();
  const value = rawValue || fallback;

  let pathname = value;

  try {
    if (/^https?:\/\//i.test(value)) {
      pathname = new URL(value).pathname;
    }
  } catch {
    pathname = value;
  }

  pathname = pathname.split("#")[0]?.split("?")[0] ?? fallback;
  pathname = pathname.replace(/\/{2,}/g, "/").trim();

  if (!pathname.startsWith("/")) {
    pathname = `/${pathname}`;
  }

  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  return pathname || fallback;
}

export function getManagedPagePath(page: PagePathLike): string {
  return normalizePagePermalinkInput(page.permalink, page.slug);
}

export function isReservedPagePermalink(path: string): boolean {
  return RESERVED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function isPageExcludedFromSitemap(slug: string): boolean {
  return slug === "login" || slug === "register" || slug === "not-found";
}
