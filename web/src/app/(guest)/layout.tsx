import Link from "next/link";
import { GuestHeader, type GuestHeaderLink, type GuestHeaderNode } from "@/app/(guest)/_components/guest-header";
import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { listManagedPages } from "@/lib/managed-pages";
import { getManagedPagePath } from "@/lib/page-paths";
import { getMenuByName } from "@/lib/menu";
import { getRoleLabel } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

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

function flattenNavTree(nodes: GuestHeaderNode[]): GuestHeaderNode[] {
  return nodes.flatMap((node) => [node, ...flattenNavTree(node.children)]);
}

export default async function GuestLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, headerMenu, footerMenu, managedPages] = await Promise.all([
    getCurrentUser(),
    getMenuByName("header"),
    getMenuByName("footer"),
    listManagedPages(),
  ]);
  const pagePathMap = new Map(managedPages.map((page) => [page.slug, getManagedPagePath(page)]));
  const dashboardHref = user && isAdminRole(user.role) ? ROUTES.ADMIN.DASHBOARD : ROUTES.CUSTOMER.DASHBOARD;
  const settingsHref = user && isAdminRole(user.role) ? ROUTES.ADMIN.CONFIG : ROUTES.CUSTOMER.SETTINGS;
  const headerLinks = mapMenuLinks(headerMenu?.items, pagePathMap);
  const footerLinks = mapMenuLinks(footerMenu?.items, pagePathMap);
  const headerTree = buildNavTree(headerLinks);
  const footerTree = buildNavTree(footerLinks);

  return (
    <div className="min-h-full w-full">
      <GuestHeader
        user={user ? { username: user.username, role: user.role } : null}
        headerTree={headerTree}
        dashboardHref={dashboardHref}
        settingsHref={settingsHref}
      />
      <main className="pt-20 bg-[linear-gradient(180deg,#fffdfb_0%,#fbf3ee_42%,#f3e9e1_100%)]">
        {children}
      </main>
      <footer className="mt-auto border-t border-stone-200 bg-[linear-gradient(180deg,#fffaf7_0%,#f4ede7_100%)]">
        <div className="container mx-auto grid gap-10 px-4 py-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-stone-400">pinklove guest</p>
            <h2 className="text-xl font-semibold text-stone-950 sm:text-2xl lg:text-3xl 2xl:text-4xl">
              Thiệp cưới online gọn, rõ và dễ tùy chỉnh.
            </h2>
            <p className="text-sm leading-7 text-stone-600 md:text-base lg:text-lg">
              PinkLove giúp bạn bắt đầu nhanh với mẫu có sẵn hoặc tự dựng thiệp theo ý muốn, rồi tiếp tục chỉnh nội dung trong tài khoản của mình.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Điều hướng</p>
            <div className="flex flex-col gap-2">
              {flattenNavTree(footerTree).map((item) => (
                <Link key={item.id} href={item.href} className="text-sm text-stone-600 transition hover:text-stone-950 md:text-base">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Tài khoản</p>
            <div className="flex flex-col gap-2">
              {user ? (
                <>
                  <Link href={dashboardHref} className="text-sm text-stone-600 transition hover:text-stone-950 md:text-base">
                    {isAdminRole(user.role) ? "Bảng điều khiển admin" : "Khu vực khách hàng"}
                  </Link>
                  <p className="text-sm text-stone-500 md:text-base">Vai trò: {getRoleLabel(user.role)}</p>
                  <Link href={ROUTES.CUSTOMER.INVITATIONS} className="text-sm text-stone-600 transition hover:text-stone-950 md:text-base">
                    Thiệp của tôi
                  </Link>
                  <Link href={ROUTES.CHECKOUT.CART} className="text-sm text-stone-600 transition hover:text-stone-950 md:text-base">
                    Giỏ hàng
                  </Link>
                  <Link href={ROUTES.CUSTOMER.ORDERS} className="text-sm text-stone-600 transition hover:text-stone-950 md:text-base">
                    Đơn hàng của tôi
                  </Link>
                  <Link href={settingsHref} className="text-sm text-stone-600 transition hover:text-stone-950 md:text-base">
                    Cài đặt tài khoản
                  </Link>
                </>
              ) : (
                <>
                  <Link href={ROUTES.AUTH.LOGIN} className="text-sm text-stone-600 transition hover:text-stone-950 md:text-base">
                    Đăng nhập
                  </Link>
                  <Link href={ROUTES.AUTH.REGISTER} className="text-sm text-stone-600 transition hover:text-stone-950 md:text-base">
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-stone-200">
          <div className="container mx-auto flex flex-col gap-2 px-4 py-4 text-sm text-stone-500 md:flex-row md:items-center md:justify-between">
            <p>© 2026 PinkLove. All rights reserved.</p>
            <p>Khu guest dùng UI riêng. Khu admin và customer dùng shadcn/ui.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
