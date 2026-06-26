import { GuestFooter } from "@/app/user-site/_components/guest-footer";
import { GuestHeader, type GuestHeaderLink, type GuestHeaderNode } from "@/app/user-site/_components/guest-header";
import { GuestAdDisplayHost } from "@/features/ads/components/guest-ads";
import { WishlistProvider } from "@/features/offerings/components/wishlist-provider";
import { getUserWishlistOfferingIds } from "@/features/offerings/server/wishlist-service";
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
      description: string | null;
      imageUrl: string | null;
      megaMenuSpan: "full" | "half" | "third" | null;
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
    description: item.description,
    imageUrl: item.imageUrl,
    megaMenuSpan: item.megaMenuSpan,
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
  const [user, headerMenu, footerMenu, managedPages, settings, globalFields] = await Promise.all([
    getCurrentUser(),
    getMenuByName("header"),
    getMenuByName("footer"),
    listManagedPages(),
    getSystemSettings(),
    getGlobalFields(),
  ]);
  const pagePathMap = new Map(managedPages.map((page) => [page.slug, getManagedPagePath(page)]));
  const dashboardHref = user && isAdminRole(user.role) ? ROUTES.ADMIN.DASHBOARD : ROUTES.CUSTOMER.DASHBOARD;
  const settingsHref = user && isAdminRole(user.role) ? ROUTES.ADMIN.CONFIG : ROUTES.CUSTOMER.CONFIG;
  const headerLinks = mapMenuLinks(headerMenu?.items, pagePathMap);
  const headerTree = buildNavTree(headerLinks);
  const footerColumns = buildNavTree(mapMenuLinks(footerMenu?.items, pagePathMap)).map((item) => ({
    id: item.id,
    title: item.label,
    links: item.children.map((child) => ({
      label: child.label,
      url: child.href,
    })),
  }));
  const wishlistOfferingIds = user ? await getUserWishlistOfferingIds(user.id) : [];

  return (
    <div id="top" className="min-h-full w-full">
      <WishlistProvider authenticated={Boolean(user)} initialOfferingIds={wishlistOfferingIds}>
        <GuestHeader
          user={user ? { accountName: user.accountName, role: user.role } : null}
          headerTree={headerTree}
          dashboardHref={dashboardHref}
          settingsHref={settingsHref}
          siteName={settings.branding.siteName}
          siteLogo={settings.branding.brandLogo || undefined}
        />
        <main className="guest-soft-top-bg contact-wave-bg relative isolate overflow-hidden">
          {children}
        </main>
        <GuestFooter
          globalFields={globalFields}
          columns={footerColumns}
        />
        <GuestAdDisplayHost />
      </WishlistProvider>
    </div>
  );
}
