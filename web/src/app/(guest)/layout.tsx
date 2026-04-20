import { GuestFooter } from "@/app/(guest)/_components/guest-footer";
import { GuestHeader, type GuestHeaderLink, type GuestHeaderNode } from "@/app/(guest)/_components/guest-header";
import { WishlistProvider } from "@/features/products/components/wishlist-provider";
import { getUserWishlistProductIds } from "@/features/products/server/wishlist-service";
import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { getGlobalFields } from "@/lib/global-fields";
import { listManagedPages } from "@/lib/managed-pages";
import { getManagedPagePath } from "@/lib/page-paths";
import { getMenuByName } from "@/lib/menu";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

function resolveMenuHref(pageSlug: string | null, url: string | null, pagePathMap: Map<string, string>) {
  if (url) return url;
  if (!pageSlug) return "/";
  return pagePathMap.get(pageSlug) || "/";
}

function mapMenuLinks(
  items:
    | Array<{
      id: string;
      label: string;
      pageSlug: string | null;
      url: string | null;
      parentId?: string | null;
    }>
    | undefined,
  pagePathMap: Map<string, string>,
) {
  if (!items?.length) return [];

  return items.map((item) => ({
    id: item.id,
    label: item.label,
    href: resolveMenuHref(item.pageSlug, item.url, pagePathMap),
    parentId: item.parentId,
  }));
}

function buildNavTree(links: GuestHeaderLink[]): GuestHeaderNode[] {
  const nodeMap = new Map<string, GuestHeaderNode>();

  for (const item of links) {
    nodeMap.set(item.id, { ...item, children: [] });
  }

  const roots: GuestHeaderNode[] = [];
  for (const item of links) {
    const node = nodeMap.get(item.id);
    if (!node) continue;

    if (item.parentId && nodeMap.has(item.parentId)) {
      nodeMap.get(item.parentId)?.children.push(node);
      continue;
    }

    roots.push(node);
  }

  return roots;
}

export default async function GuestLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, headerMenu, managedPages, settings, globalFields] = await Promise.all([
    getCurrentUser(),
    getMenuByName("header"),
    listManagedPages(),
    getSystemSettings(),
    getGlobalFields(),
  ]);
  const pagePathMap = new Map(managedPages.map((page) => [page.slug, getManagedPagePath(page)]));
  const dashboardHref = user && isAdminRole(user.role) ? ROUTES.ADMIN.DASHBOARD : ROUTES.CUSTOMER.DASHBOARD;
  const settingsHref = user && isAdminRole(user.role) ? ROUTES.ADMIN.CONFIG : ROUTES.CUSTOMER.SETTINGS;
  const headerLinks = mapMenuLinks(headerMenu?.items, pagePathMap);
  const headerTree = buildNavTree(headerLinks);
  const wishlistProductIds = user ? await getUserWishlistProductIds(user.id) : [];

  return (
    <div id="top" className="min-h-full w-full">
      <WishlistProvider authenticated={Boolean(user)} initialProductIds={wishlistProductIds}>
        <GuestHeader
          user={user ? { username: user.username, role: user.role } : null}
          headerTree={headerTree}
          dashboardHref={dashboardHref}
          settingsHref={settingsHref}
          siteName={settings.branding.siteName || "PinkLove"}
          siteLogo={settings.branding.brandLogo || undefined}
        />
        <main>
          {children}
        </main>
        <GuestFooter
          globalFields={globalFields}
        />
      </WishlistProvider>
    </div>
  );
}
