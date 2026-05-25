export type RouteActiveOptions = {
  exact?: boolean;
  matchPrefixes?: string[];
  excludePaths?: string[];
  excludePrefixes?: string[];
};

function normalizeRoute(value: string) {
  if (value === "/") {
    return value;
  }

  return value.replace(/\/+$/, "");
}

function isSameOrChildPath(pathname: string, prefix: string) {
  const currentPath = normalizeRoute(pathname);
  const routePrefix = normalizeRoute(prefix);

  if (!currentPath || !routePrefix) {
    return false;
  }

  if (routePrefix === "/") {
    return currentPath === routePrefix;
  }

  return currentPath === routePrefix || currentPath.startsWith(`${routePrefix}/`);
}

export function isRouteActive(pathname: string, href: string, exactOrOptions: boolean | RouteActiveOptions = false) {
  if (!pathname || !href) {
    return false;
  }

  const options = typeof exactOrOptions === "boolean" ? { exact: exactOrOptions } : exactOrOptions;
  const exact = options.exact ?? false;

  if (options.excludePaths?.some((path) => normalizeRoute(pathname) === normalizeRoute(path))) {
    return false;
  }

  if (options.excludePrefixes?.some((prefix) => isSameOrChildPath(pathname, prefix))) {
    return false;
  }

  if (href === "/") {
    return pathname === href;
  }

  if (options.matchPrefixes?.some((prefix) => isSameOrChildPath(pathname, prefix))) {
    return true;
  }

  if (exact) {
    return normalizeRoute(pathname) === normalizeRoute(href);
  }

  return isSameOrChildPath(pathname, href);
}
