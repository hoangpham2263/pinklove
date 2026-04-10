export function isRouteActive(pathname: string, href: string, exact = false) {
  if (!pathname || !href) {
    return false;
  }

  if (href === "/") {
    return pathname === href;
  }

  if (exact) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
