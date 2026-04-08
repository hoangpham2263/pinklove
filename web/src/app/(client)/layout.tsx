import Link from "next/link";
import { listPublishedBlogCategories } from "@/features/blog/server/service";
import { getCurrentUser } from "@/lib/auth";
import { getMenuByName } from "@/lib/menu";
import { ROUTES } from "@/lib/routes";

type NavLink = {
  id: string;
  label: string;
  href: string;
  parentId?: string | null;
};

type NavNode = NavLink & {
  children: NavLink[];
};

const toolLinks: NavLink[] = [
  { id: "client-tools", label: "Công cụ", href: ROUTES.TOOLS },
  { id: "tools-qr-builder", label: "QR mừng cưới", href: ROUTES.TOOLS_PAGES.QR_BUILDER, parentId: "client-tools" },
  { id: "tools-wedding-budget", label: "Bảng tính chi phí cưới", href: ROUTES.TOOLS_PAGES.WEDDING_BUDGET, parentId: "client-tools" },
];

const primaryClientLinks: NavLink[] = [
  { id: "client-templates", label: "Mẫu thiệp", href: ROUTES.TEMPLATES },
  { id: "client-blog", label: "Blog", href: ROUTES.BLOG },
  { id: "client-services", label: "Gói dịch vụ", href: ROUTES.SERVICES },
  { id: "client-builder", label: "Tự tạo thiệp", href: ROUTES.BUILDER },
  ...toolLinks,
];

function appendMissingLinks(links: NavLink[], requiredLinks: NavLink[]) {
  const signatures = new Set(
    links.map((item) => `${item.href}::${item.parentId ?? "root"}`)
  );
  return [
    ...links,
    ...requiredLinks.filter((item) => !signatures.has(`${item.href}::${item.parentId ?? "root"}`)),
  ];
}

function resolveMenuHref(pageSlug: string | null, url: string | null) {
  if (url) return url;
  if (!pageSlug || pageSlug === "home") return "/";
  return `/${pageSlug}`;
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
  fallback: NavLink[]
) {
  if (!items?.length) {
    return fallback;
  }

  return items.map((item) => ({
    id: item.id,
    label: item.label,
    href: resolveMenuHref(item.pageSlug, item.url),
    parentId: item.parentId,
  }));
}

function buildNavTree(links: NavLink[]): NavNode[] {
  const nodeMap = new Map<string, NavNode>();

  for (const item of links) {
    nodeMap.set(item.id, { ...item, children: [] });
  }

  const roots: NavNode[] = [];
  for (const item of links) {
    const node = nodeMap.get(item.id);
    if (!node) continue;

    if (item.parentId && nodeMap.has(item.parentId)) {
      nodeMap.get(item.parentId)?.children.push({
        id: node.id,
        label: node.label,
        href: node.href,
        parentId: node.parentId,
      });
      continue;
    }

    roots.push(node);
  }

  return roots;
}

function withDynamicChildren(rootLinks: NavNode[], blogCategoryLinks: NavLink[]) {
  return rootLinks.map((item) => {
    if (item.href === ROUTES.TOOLS && item.children.length === 0) {
      return {
        ...item,
        children: [
          { id: `${item.id}-qr-builder`, label: "QR mừng cưới", href: ROUTES.TOOLS_PAGES.QR_BUILDER, parentId: item.id },
          { id: `${item.id}-wedding-budget`, label: "Bảng tính chi phí cưới", href: ROUTES.TOOLS_PAGES.WEDDING_BUDGET, parentId: item.id },
        ],
      };
    }

    if (item.href === ROUTES.BLOG && item.children.length === 0) {
      return {
        ...item,
        children: blogCategoryLinks,
      };
    }

    return item;
  });
}

function NavDropdown({ label, href, items }: { label: string; href: string; items: NavLink[] }) {
  return (
    <div className="group relative">
      <Link href={href} className="text-sm text-stone-500 transition hover:text-stone-950">
        {label}
      </Link>
      <div className="absolute left-0 top-full h-3 w-full" />
      <div className="invisible absolute left-0 top-[calc(100%+0.5rem)] z-50 min-w-56 translate-y-2 rounded-xl border border-stone-200 bg-white p-2 opacity-0 shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 lg:rounded-2xl">
        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <Link key={item.id} href={item.href} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl">
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function ClientLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, headerMenu, footerMenu, blogCategories] = await Promise.all([
    getCurrentUser(),
    getMenuByName("header"),
    getMenuByName("footer"),
    listPublishedBlogCategories(),
  ]);
  const dashboardHref = user?.role === "admin" ? ROUTES.ADMIN.DASHBOARD : ROUTES.USER.DASHBOARD;
  const settingsHref = user?.role === "admin" ? ROUTES.ADMIN.SETTINGS : ROUTES.USER.SETTINGS;
  const headerLinks = mapMenuLinks(headerMenu?.items, [
    { id: "header-home", label: "Home", href: "/" },
    { id: "header-templates", label: "Mẫu thiệp", href: ROUTES.TEMPLATES },
    { id: "header-services", label: "Gói dịch vụ", href: ROUTES.SERVICES },
    { id: "header-builder", label: "Tự tạo thiệp", href: ROUTES.BUILDER },
    { id: "header-about", label: "About Us", href: "/about-us" },
    { id: "header-contact", label: "Contact", href: "/contact" },
  ]);
  const normalizedHeaderLinks = appendMissingLinks(headerLinks, primaryClientLinks);
  const footerLinks = mapMenuLinks(footerMenu?.items, [
    { id: "footer-home", label: "Trang chủ", href: "/" },
    { id: "footer-templates", label: "Mẫu thiệp", href: ROUTES.TEMPLATES },
    { id: "footer-tools", label: "Công cụ", href: ROUTES.TOOLS },
    { id: "footer-services", label: "Gói dịch vụ", href: ROUTES.SERVICES },
    { id: "footer-builder", label: "Tự tạo thiệp", href: ROUTES.BUILDER },
    { id: "footer-about", label: "Giới thiệu", href: "/about-us" },
    { id: "footer-contact", label: "Liên hệ", href: "/contact" },
  ]);
  const normalizedFooterLinks = appendMissingLinks(footerLinks, [
    { id: "footer-tools", label: "Công cụ", href: ROUTES.TOOLS },
    { id: "footer-blog", label: "Blog", href: ROUTES.BLOG },
  ]);
  const blogCategoryLinks: NavLink[] = blogCategories.map((item) => ({
    id: item.id,
    label: item.name,
    href: ROUTES.BLOG_PAGES.CATEGORY(item.slug),
  }));
  const headerTree = withDynamicChildren(buildNavTree(normalizedHeaderLinks), blogCategoryLinks);
  const footerTree = buildNavTree(normalizedFooterLinks);

 return (
 <div className="flex min-h-full flex-1 flex-col">
  <header className="fixed inset-x-0 top-0 z-50 border-b border-stone-200 bg-[rgba(255,250,247,0.9)] backdrop-blur">
  <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
   <Link href="/" className="font-semibold tracking-[0.18em] text-stone-950 uppercase">
   Pinklove Client
   </Link>
   <nav className="flex items-center gap-4">
   {headerTree.map((item) =>
    item.children.length > 0 ? (
      <NavDropdown key={item.id} label={item.label} href={item.href} items={item.children} />
    ) : (
      <Link key={item.id} href={item.href} className="text-sm text-stone-500 transition hover:text-stone-950">
       {item.label}
      </Link>
    )
   )}
   <details className="group relative">
    <summary className="list-none cursor-pointer text-sm text-stone-500 hover:text-stone-950">
    {user ? user.username :"Login"}
    </summary>
                    <div className="absolute right-0 top-8 z-50 min-w-48 rounded-xl border border-stone-200 bg-white p-2 shadow-[0_18px_60px_rgba(15,23,42,0.08)] lg:rounded-2xl">    {user ? (
     <div className="flex flex-col gap-1">
     <p className="px-2 py-1 text-sm text-stone-500">
      {user.username} ({user.role})
     </p>
     <Link href={dashboardHref} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl">
      {user.role ==="admin" ?"Quản lý Admin" :"Trang người dùng"}
     </Link>
                       <Link href={ROUTES.USER.SITES} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl">
                         Thiệp của tôi
                       </Link>
                       <Link href={settingsHref} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl">
                         Cài đặt tài khoản
                       </Link>
                       <form action={ROUTES.AUTH.LOGOUT_API} method="POST">
                         <button
                           type="submit"      className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-stone-100 lg:rounded-2xl"
      >
      Đăng xuất
      </button>
     </form>
     </div>
    ) : (
     <div className="flex flex-col gap-1">
                       <Link href={ROUTES.AUTH.LOGIN} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl">
                         Đăng nhập
                       </Link>
                       <Link href={ROUTES.AUTH.REGISTER} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl">
                         Đăng ký
                       </Link>     </div>
    )}
    </div>
   </details>
   </nav>
  </div>
  </header>
  <main className="flex flex-1 flex-col pt-16">
  {children}
  </main>
  <footer className="mt-auto border-t border-stone-200 bg-[linear-gradient(180deg,#fffaf7_0%,#f4ede7_100%)]">
  <div className="container mx-auto grid gap-10 px-4 py-12 lg:grid-cols-[1.4fr_1fr_1fr]">
   <div className="space-y-4">
    <p className="text-xs uppercase tracking-[0.35em] text-stone-400">pinklove client</p>
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
     {footerTree.flatMap((item) => [item, ...item.children]).map((item) => (
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
        {user.role === "admin" ? "Dashboard admin" : "Trang người dùng"}
       </Link>
       <Link href={ROUTES.USER.SITES} className="text-sm text-stone-600 transition hover:text-stone-950 md:text-base">
        Thiệp của tôi
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
    <p>Client area uses custom UI. Admin and user areas use shadcn/ui.</p>
   </div>
  </div>
  </footer>
 </div>
 );
}
