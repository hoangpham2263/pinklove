"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookHeart, Mail, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BlogCard } from "@/features/blog/components/blog-card";
import type { BlogCategory, BlogPost } from "@/features/blog/types";
import { getBlogCategoryPath, getBlogPostPath } from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";

type BlogTabsProps = {
  categories: BlogCategory[];
  posts: BlogPost[];
  title: string;
  excerpt: string;
};

function PostImage({ post, className }: { post: BlogPost; className?: string }) {
  if (!post.coverImage) {
    return (
      <div className={`flex items-center justify-center bg-[linear-gradient(135deg,#fff2fd_0%,#f3ddff_55%,#ffd6f8_100%)] ${className || ""}`}>
        <BookHeart className="size-12 text-[#d94dce]/35" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <Image
      src={post.coverImage}
      alt={post.title}
      fill
      className={`object-cover transition duration-500 group-hover:scale-[1.03] ${className || ""}`}
      sizes="(min-width: 1024px) 50vw, 100vw"
    />
  );
}

export function BlogTabs({ categories, posts, title, excerpt }: BlogTabsProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("");
  const featuredPost = posts[0];
  const featuredSidePosts = posts.slice(1, 4);
  const visiblePosts = posts.slice(featuredSidePosts.length ? 4 : 1, 10);
  const gridPosts = useMemo(() => {
    const sourcePosts = visiblePosts.length ? visiblePosts : posts;
    const filteredPosts = activeCategory
      ? posts.filter((post) => post.categorySlug === activeCategory)
      : sourcePosts;

    return filteredPosts.slice(0, activeCategory ? undefined : 6);
  }, [activeCategory, posts, visiblePosts]);
  const spotlightCategory = categories.find((category) =>
    posts.filter((post) => post.categorySlug === category.slug).length >= 2
  );
  const spotlightPosts = spotlightCategory
    ? posts.filter((post) => post.categorySlug === spotlightCategory.slug).slice(0, 6)
    : posts.slice(0, 6);
  const getCategoryHref = (slug: string) => getBlogCategoryPath(slug);
  const getPostHref = (post: BlogPost) => getBlogPostPath(post);

  useEffect(() => {
    const syncCategoryFromQuery = () => {
      const requestedCategory = new URLSearchParams(window.location.search).get("category") || "";
      setActiveCategory(categories.some((category) => category.slug === requestedCategory) ? requestedCategory : "");
    };

    syncCategoryFromQuery();
    window.addEventListener("popstate", syncCategoryFromQuery);
    return () => window.removeEventListener("popstate", syncCategoryFromQuery);
  }, [categories]);

  function selectCategory(categorySlug: string) {
    const url = new URL(window.location.href);

    if (categorySlug) {
      url.searchParams.set("category", categorySlug);
    } else {
      url.searchParams.delete("category");
    }

    router.push(`${url.pathname}${url.search}${url.hash}`, { scroll: false });
    setActiveCategory(categorySlug);
  }

  return (
    <div className="bg-white text-stone-950">
      <section className="relative overflow-hidden bg-gradient-to-b from-[#ffd1f7] via-[#f9e8ff] to-[#f9f1ff]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-16 size-72 rounded-full bg-white/40 blur-3xl" />
          <div className="absolute right-[8%] top-8 size-64 rounded-full bg-[#ff6ff5]/15 blur-3xl" />
          <span className="cta-sparkle-float absolute left-[8%] top-[28%] text-4xl text-white/90">✦</span>
          <span className="cta-heart-pop absolute left-[42%] top-[18%] text-2xl text-[#ff6ff5]/35">♥</span>
          <span className="cta-sparkle-float absolute right-[7%] bottom-[20%] text-5xl text-white/80">✦</span>
        </div>

        <div className="container relative z-10 mx-auto grid min-h-[430px] items-center gap-10 px-4 py-16 lg:grid-cols-12 lg:py-20">
          <div className="space-y-6 text-center lg:col-span-5 lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/45 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#b529aa] backdrop-blur">
              <Sparkles className="size-4" />
              Cẩm nang cưới
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="mx-auto max-w-xl text-base font-medium leading-8 text-stone-600 lg:mx-0 lg:text-lg">
                {excerpt}
              </p>
            </div>
            <Link
              href="#kien-thuc"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#ff95f8,#ff6ff5)] px-7 text-sm font-bold text-white shadow-[0_14px_34px_rgba(255,111,245,0.28)] transition hover:-translate-y-0.5"
            >
              Khám phá ngay
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="relative hidden min-h-[310px] lg:col-span-7 lg:block">
            <div className="absolute inset-x-10 top-2 h-[285px] rotate-[-2deg] rounded-[28px] border border-white/80 bg-white/70 shadow-[0_28px_70px_rgba(91,33,89,0.13)] backdrop-blur">
              <div className="grid h-full grid-cols-[0.8fr_1.2fr] gap-4 p-5">
                <div className="rounded-2xl bg-[linear-gradient(145deg,#ff95f8,#b651e8)] p-5 text-white">
                  <BookHeart className="mb-16 size-9" />
                  <p className="text-xs font-bold uppercase tracking-[0.22em]">PinkLove</p>
                  <p className="mt-2 text-2xl font-black leading-tight">Ý tưởng cho ngày chung đôi</p>
                </div>
                <div className="space-y-3 pt-2">
                  {(posts.length ? posts.slice(0, 3) : [null, null, null]).map((post, index) => (
                    <div key={post?.id || index} className="flex gap-3 rounded-xl bg-white p-2 shadow-sm">
                      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-[#f6e9f8]">
                        {post ? <PostImage post={post} /> : null}
                      </div>
                      <div className="space-y-2 py-1">
                        <div className="h-2 w-16 rounded-full bg-[#ff6ff5]/25" />
                        <div className="h-2.5 w-32 rounded-full bg-stone-800/75" />
                        <div className="h-2 w-24 rounded-full bg-stone-200" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -right-1 top-8 grid size-16 rotate-12 place-items-center rounded-2xl border border-white bg-white/80 text-2xl text-[#ff6ff5] shadow-xl">♥</div>
            <div className="absolute bottom-0 left-0 grid size-14 -rotate-12 place-items-center rounded-2xl border border-white bg-white/80 text-2xl text-[#b651e8] shadow-xl">✦</div>
          </div>
        </div>
        <svg className="absolute inset-x-0 bottom-0 h-12 w-full translate-y-px fill-white" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 52C244 6 483 9 720 39c237 30 477 32 720-9v50H0Z" />
        </svg>
      </section>

      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#b529aa]">Đừng bỏ lỡ</p>
            <h2 className="text-3xl font-black tracking-tight lg:text-4xl">Bài viết nổi bật</h2>
          </div>
        </div>

        {featuredPost ? (
          <div className="grid gap-5 lg:grid-cols-[1.75fr_1fr]">
            <Link href={getPostHref(featuredPost)} className="group relative min-h-[360px] overflow-hidden rounded-[28px] bg-[#f7e8f8] lg:min-h-[470px]">
              <PostImage post={featuredPost} />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 space-y-3 p-6 text-white lg:p-9">
                <span className="inline-flex rounded-full bg-white/18 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] backdrop-blur">
                  {featuredPost.categoryName}
                </span>
                <h3 className="max-w-3xl text-2xl font-black leading-tight lg:text-4xl">{featuredPost.title}</h3>
                <p className="line-clamp-2 max-w-2xl text-sm leading-6 text-white/75 lg:text-base">{featuredPost.excerpt}</p>
              </div>
            </Link>
            <div className="grid gap-4">
              {featuredSidePosts.map((post) => (
                <Link key={post.id} href={getPostHref(post)} className="group grid grid-cols-[120px_1fr] items-center gap-4 rounded-2xl border border-[#f1dcef] bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(181,41,170,0.1)] sm:grid-cols-[160px_1fr]">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#f7e8f8]">
                    <PostImage post={post} />
                  </div>
                  <div className="space-y-2 pr-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b529aa]">{post.categoryName}</p>
                    <h3 className="line-clamp-2 font-bold leading-snug text-stone-900 group-hover:text-[#b529aa]">{post.title}</h3>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-400">Đọc bài <ArrowRight className="size-3" /></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-[#e8c9e5] bg-[#fff8fe] px-6 py-20 text-center text-stone-500">
            Chưa có bài viết được xuất bản.
          </div>
        )}
      </section>

      <section id="kien-thuc" className="relative bg-[#fff8fe] py-16 lg:py-24">
        <div className="pointer-events-none absolute right-0 top-0 size-72 rounded-full bg-[#ff6ff5]/8 blur-3xl" />
        <div className="container relative mx-auto px-4">
          <div className="mb-8 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#b529aa]">Cùng PinkLove chuẩn bị</p>
            <h2 className="text-3xl font-black tracking-tight lg:text-4xl">Kho kiến thức cưới</h2>
          </div>
          <div className="mb-10 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => selectCategory("")}
              aria-pressed={!activeCategory}
              className={`inline-flex min-h-10 items-center justify-center rounded-full px-5 text-sm font-bold transition ${
                !activeCategory
                  ? "bg-[#ff6ff5] text-white shadow-[0_8px_22px_rgba(255,111,245,0.22)]"
                  : "border border-[#ead8e8] bg-white text-stone-600 hover:border-[#ff6ff5] hover:text-[#b529aa]"
              }`}
            >
              Tất cả
            </button>
            {categories.map((category) => {
              const isActive = activeCategory === category.slug;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => selectCategory(category.slug)}
                  aria-pressed={isActive}
                  className={`inline-flex min-h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#ff6ff5] text-white shadow-[0_8px_22px_rgba(255,111,245,0.22)]"
                      : "border border-[#ead8e8] bg-white text-stone-600 hover:border-[#ff6ff5] hover:text-[#b529aa]"
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {gridPosts.map((post) => (
            <BlogCard
              key={post.id}
              post={post}
              postHref={getPostHref(post)}
              categoryHref={getCategoryHref(post.categorySlug)}
            />
          ))}
          </div>
          {!gridPosts.length ? (
            <div className="rounded-[24px] border border-dashed border-[#e8c9e5] bg-white px-6 py-14 text-center text-sm text-stone-500">
              Chưa có bài viết trong danh mục này.
            </div>
          ) : null}
          {!activeCategory && posts.length > 6 ? (
            <div className="mt-10 text-center">
              <Link href={ROUTES.BLOG} className="inline-flex items-center gap-2 text-sm font-bold text-[#b529aa] hover:text-stone-950">
                Xem tất cả bài viết <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {spotlightPosts.length ? (
        <section className="container mx-auto px-4 py-16 lg:py-24">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-[#b529aa]">
                <BookHeart className="size-6" />
                <span className="text-xs font-bold uppercase tracking-[0.22em]">Chuyên mục</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight lg:text-4xl">
                {spotlightCategory?.name || "Cảm hứng mới"}
              </h2>
              {spotlightCategory?.description ? <p className="mt-2 max-w-2xl text-stone-500">{spotlightCategory.description}</p> : null}
            </div>
            {spotlightCategory ? (
              <Link href={getCategoryHref(spotlightCategory.slug)} className="hidden items-center gap-2 text-sm font-bold text-[#b529aa] sm:inline-flex">
                Xem chuyên mục <ArrowRight className="size-4" />
              </Link>
            ) : null}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {spotlightPosts.map((post) => (
              <BlogCard key={`spotlight-${post.id}`} post={post} postHref={getPostHref(post)} categoryHref={getCategoryHref(post.categorySlug)} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="relative overflow-hidden bg-gradient-to-b from-[#f9f1ff] to-[#ffdff8] py-20 lg:py-28">
        <div className="pointer-events-none absolute inset-0">
          <span className="cta-sparkle-float absolute left-[12%] top-[24%] text-4xl text-white">✦</span>
          <span className="cta-heart-pop absolute right-[14%] bottom-[22%] text-3xl text-[#ff6ff5]/25">♥</span>
        </div>
        <div className="container relative mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-white text-[#b529aa] shadow-[0_14px_36px_rgba(181,41,170,0.12)]">
              <Mail className="size-6" />
            </div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#b529aa]">Đăng ký nhận bản tin</p>
            <h2 className="text-3xl font-black tracking-[-0.03em] sm:text-4xl lg:text-5xl">Cảm hứng mới cho ngày trọng đại.</h2>
            <p className="mx-auto mt-4 max-w-xl leading-7 text-stone-600">Nhận các bài viết chọn lọc, checklist và ý tưởng cưới mới nhất từ PinkLove.</p>
            <form className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row" onSubmit={(event) => event.preventDefault()}>
              <input type="email" aria-label="Email nhận bản tin" placeholder="Email của bạn" className="h-13 flex-1 rounded-full border border-white bg-white/85 px-6 text-sm outline-none ring-[#ff6ff5]/25 transition focus:ring-4" />
              <button type="submit" className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-stone-950 px-7 text-sm font-bold text-white transition hover:bg-[#b529aa]">
                Đăng ký <ArrowRight className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
