import type { Metadata } from "next";
import Link from "next/link";
import {
  GuestLinkButton,
  GuestPanel,
  GuestPanelBody,
  GuestPanelHeader,
  GuestPanelTitle,
  GuestShell,
} from "@/app/(guest)/_components/guest-ui";
import { BlogCard } from "@/features/blog/components/blog-card";
import { LoopOnlineInvitationCard } from "@/features/products/components/LoopOnlineInvitationCard";
import { LoopProductCard } from "@/features/products/components/LoopProductCard";
import { searchGuestContent } from "@/features/search/server/service";
import { getManagedPagePath } from "@/lib/page-paths";
import { getBlogCategoryPath, getBlogPostPath } from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";
import { createSeoMetadata } from "@/lib/seo";

type SearchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchQuery(input?: string | string[]) {
  if (Array.isArray(input)) {
    return input[0]?.trim() ?? "";
  }

  return typeof input === "string" ? input.trim() : "";
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const query = getSearchQuery((await searchParams)?.q);

  return createSeoMetadata({
    title: query ? `Tim kiem: ${query}` : "Tim kiem",
    description: query ? `Ket qua tim kiem cho tu khoa ${query}.` : "Tim san pham, bai viet va trang cong khai tren PinkLove.",
    path: ROUTES.SEARCH,
    noindex: true,
  });
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = getSearchQuery((await searchParams)?.q);
  const results = query ? await searchGuestContent(query) : { products: [], posts: [], pages: [] };
  const totalResults = results.products.length + results.posts.length + results.pages.length;

  return (
    <GuestShell className="gap-10 pb-16 pt-32 lg:pt-36">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-[0.4em] text-stone-400">Search</p>
        <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2xl:text-5xl">
          {query ? `Ket qua cho "${query}"` : "Tim noi dung tren PinkLove"}
        </h1>
        <p className="text-sm leading-8 text-stone-600 md:text-base lg:text-lg">
          {query
            ? `Tim thay ${totalResults} ket qua theo san pham, blog va trang cong khai.`
            : "Nhap tu khoa de tim mau thiep, bai viet hoac cac trang thong tin cong khai."}
        </p>
      </div>

      <GuestPanel>
        <GuestPanelBody className="space-y-4">
          <form action={ROUTES.SEARCH} method="GET" className="flex flex-col gap-3 md:flex-row">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Tim mau thiep, builder, blog..."
              className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-950 lg:rounded-2xl"
            />
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-stone-950 px-6 text-sm font-semibold text-white transition hover:bg-stone-800 lg:rounded-2xl"
            >
              Tim kiem
            </button>
          </form>
          {!query ? (
            <div className="flex flex-wrap gap-3">
              <GuestLinkButton href={ROUTES.TEMPLATES}>Xem thiệp mẫu sẵn</GuestLinkButton>
              <GuestLinkButton href={ROUTES.BUILDER} variant="secondary">Xem builder starter</GuestLinkButton>
              <GuestLinkButton href={ROUTES.BLOG} variant="secondary">Doc blog cuoi</GuestLinkButton>
            </div>
          ) : null}
        </GuestPanelBody>
      </GuestPanel>

      {query && totalResults === 0 ? (
        <GuestPanel>
          <GuestPanelBody className="space-y-4">
            <p className="text-sm leading-7 text-stone-600 md:text-base">
              Khong tim thay ket qua phu hop. Thu doi tu khoa ngan hon hoac chuyen sang mot nhom noi dung khac.
            </p>
            <div className="flex flex-wrap gap-3">
              <GuestLinkButton href={ROUTES.TEMPLATES}>Xem thiệp mẫu sẵn</GuestLinkButton>
              <GuestLinkButton href={ROUTES.BLOG} variant="secondary">Xem bài viết mới</GuestLinkButton>
            </div>
          </GuestPanelBody>
        </GuestPanel>
      ) : null}

      {results.products.length > 0 ? (
        <section className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Sản phẩm</p>
            <h2 className="text-xl font-semibold text-stone-950 sm:text-2xl lg:text-3xl">Mẫu thiệp và builder</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            {results.products.map((product) => (
              product.productType !== "general_product" ? (
                <LoopOnlineInvitationCard
                  key={product.id}
                  product={product}
                />
              ) : (
                <LoopProductCard
                  key={product.id}
                  product={product}
                />
              )
            ))}
          </div>
        </section>
      ) : null}

      {results.posts.length > 0 ? (
        <section className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Blog</p>
            <h2 className="text-xl font-semibold text-stone-950 sm:text-2xl lg:text-3xl">Bai viet lien quan</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {results.posts.map((post) => (
              <BlogCard
                key={post.id}
                post={post}
                postHref={getBlogPostPath(post)}
                categoryHref={getBlogCategoryPath(post.categorySlug)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {results.pages.length > 0 ? (
        <section className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Trang</p>
            <h2 className="text-xl font-semibold text-stone-950 sm:text-2xl lg:text-3xl">Trang cong khai</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {results.pages.map((page) => (
              <GuestPanel key={page.slug}>
                <GuestPanelHeader>
                  <GuestPanelTitle>{page.title || page.name}</GuestPanelTitle>
                </GuestPanelHeader>
                <GuestPanelBody className="space-y-4">
                  <p className="text-sm leading-7 text-stone-600 md:text-base">
                    {page.excerpt || "Trang thong tin cong khai tren PinkLove."}
                  </p>
                  <Link
                    href={getManagedPagePath(page)}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-900 transition hover:bg-stone-50 lg:rounded-2xl"
                  >
                    Mo trang
                  </Link>
                </GuestPanelBody>
              </GuestPanel>
            ))}
          </div>
        </section>
      ) : null}
    </GuestShell>
  );
}
