"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClientPanel, ClientPanelBody, ClientPanelHeader } from "@/app/(client)/_components/client-ui";
import { BlogCard } from "@/features/blog/components/blog-card";
import type { BlogCategory, BlogPost } from "@/features/blog/types";
import { getBlogCategoryPath, getBlogPostPath, type PublicPermalinkConfig } from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";

type BlogTabsProps = {
  categories: BlogCategory[];
  posts: BlogPost[];
  permalinkConfig?: PublicPermalinkConfig;
};

export function BlogTabs({ categories, posts, permalinkConfig }: BlogTabsProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredPosts = useMemo(() => {
    if (activeCategory === "all") {
      return posts;
    }

    return posts.filter((post) => post.categorySlug === activeCategory);
  }, [activeCategory, posts]);

  const featuredPost = filteredPosts[0];
  const recentPosts = filteredPosts.slice(1);
  const visiblePosts = recentPosts.length ? recentPosts : filteredPosts;
  const getCategoryHref = (slug: string) =>
    permalinkConfig ? getBlogCategoryPath(slug, permalinkConfig) : ROUTES.BLOG_PAGES.CATEGORY(slug);
  const getPostHref = (post: BlogPost) =>
    permalinkConfig ? getBlogPostPath(post, permalinkConfig) : ROUTES.BLOG_PAGES.POST(post.slug);

  return (
    <>
      <section className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-semibold transition lg:rounded-2xl ${
              activeCategory === "all"
                ? "border border-stone-900 bg-stone-950 text-white"
                : "border border-stone-300 bg-white text-stone-900 hover:bg-stone-50"
            }`}
          >
            Tất cả
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.slug)}
              className={`inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-semibold transition lg:rounded-2xl ${
                activeCategory === category.slug
                  ? "border border-stone-900 bg-stone-950 text-white"
                  : "border border-stone-300 bg-white text-stone-900 hover:bg-stone-50"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      {featuredPost ? (
        <ClientPanel>
          <ClientPanelHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Bài nổi bật</p>
              {activeCategory !== "all" ? (
                <Link
                  href={getCategoryHref(activeCategory)}
                  className="text-xs uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900"
                >
                  Xem trang danh mục
                </Link>
              ) : null}
            </div>
          </ClientPanelHeader>
          <ClientPanelBody className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="min-h-80 rounded-xl bg-[linear-gradient(135deg,#f4ede7_0%,#ead8c8_100%)] lg:rounded-2xl" />
            <div className="space-y-5">
              <Link
                href={getCategoryHref(featuredPost.categorySlug)}
                className="inline-flex text-xs uppercase tracking-[0.25em] text-stone-400 hover:text-stone-900"
              >
                {featuredPost.categoryName}
              </Link>
              <h2 className="text-xl font-semibold text-stone-950 sm:text-2xl lg:text-3xl 2xl:text-4xl">
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
          </ClientPanelBody>
        </ClientPanel>
      ) : null}

      <section className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400">
            {activeCategory === "all" ? "Mới nhất" : "Theo danh mục"}
          </p>
          <h2 className="text-xl font-semibold text-stone-950 sm:text-2xl lg:text-3xl 2xl:text-4xl">Danh sách bài viết</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
