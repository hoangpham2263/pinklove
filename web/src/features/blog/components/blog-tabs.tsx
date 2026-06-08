import Link from "next/link";
import { GuestPanel, GuestPanelBody, GuestPanelHeader } from "@/app/(guest)/_components/guest-ui";
import { BlogCard } from "@/features/blog/components/blog-card";
import type { BlogCategory, BlogPost } from "@/features/blog/types";
import { getBlogCategoryPath, getBlogPostPath } from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";

type BlogTabsProps = {
  categories: BlogCategory[];
  posts: BlogPost[];
};

export function BlogTabs({ categories, posts }: BlogTabsProps) {
  const featuredPost = posts[0];
  const recentPosts = posts.slice(1);
  const visiblePosts = recentPosts.length ? recentPosts : posts;
  const getCategoryHref = (slug: string) => getBlogCategoryPath(slug);
  const getPostHref = (post: BlogPost) => getBlogPostPath(post);

  return (
    <>
      <section className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={ROUTES.BLOG}
            aria-current="page"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-stone-900 bg-stone-950 px-5 text-sm font-semibold text-white transition lg:rounded-2xl"
          >
            Tất cả
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={getCategoryHref(category.slug)}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-900 transition hover:bg-stone-50 lg:rounded-2xl"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      {featuredPost ? (
        <GuestPanel>
          <GuestPanelHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Bài nổi bật</p>
            </div>
          </GuestPanelHeader>
          <GuestPanelBody className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="min-h-80 rounded-xl bg-[linear-gradient(135deg,#f4ede7_0%,#ead8c8_100%)] lg:rounded-2xl" />
            <div className="space-y-5">
              <Link
                href={getCategoryHref(featuredPost.categorySlug)}
                className="inline-flex text-xs uppercase tracking-[0.25em] text-stone-400 hover:text-stone-900"
              >
                {featuredPost.categoryName}
              </Link>
              <h2 className="text-xl font-semibold text-stone-950 sm:text-2xl lg:text-3xl 2 xl:text-4xl">
                <Link href={getPostHref(featuredPost)} className="hover:text-stone-700">
                  {featuredPost.title}
                </Link>
              </h2>
              <p className="text-sm leading-8 text-stone-600 md:text-base lg:text-lg">{featuredPost.excerpt}</p>
              <Link
                href={getPostHref(featuredPost)}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-stone-950 px-6 text-sm font-semibold text-white transition hover:bg-stone-800 lg:rounded-2xl"
              >
                Đọc bài viết
              </Link>
            </div>
          </GuestPanelBody>
        </GuestPanel>
      ) : null}

      <section className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400">
            Mới nhất
          </p>
          <h2 className="text-xl font-semibold text-stone-950 sm:text-2xl lg:text-3xl 2 xl:text-4xl">Danh sách bài viết</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visiblePosts.map((post) => (
            <BlogCard
              key={post.id}
              post={post}
              postHref={getPostHref(post)}
              categoryHref={getCategoryHref(post.categorySlug)}
            />
          ))}
        </div>
      </section>
    </>
  );
}
