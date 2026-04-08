import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientShell } from "@/app/(client)/_components/client-ui";
import { BlogCard } from "@/features/blog/components/blog-card";
import {
  getPublishedBlogCategoryBySlug,
  listPublishedBlogCategories,
  listPublishedBlogPosts,
} from "@/features/blog/server/service";
import { ROUTES } from "@/lib/routes";
import { createSeoMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getPublishedBlogCategoryBySlug(slug);

  if (!category) {
    return createSeoMetadata({
      title: "Danh mục blog",
      description: "Danh mục blog cưới trên PinkLove.",
      path: ROUTES.BLOG,
      noindex: true,
    });
  }

  return createSeoMetadata({
    title: category.name,
    description: category.description ?? `Khám phá các bài viết trong danh mục ${category.name}.`,
    path: ROUTES.BLOG_PAGES.CATEGORY(category.slug),
    keywords: ["blog cưới", category.name.toLowerCase()],
  });
}

export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [category, categories, posts] = await Promise.all([
    getPublishedBlogCategoryBySlug(slug),
    listPublishedBlogCategories(),
    listPublishedBlogPosts(slug),
  ]);

  if (!category) {
    return notFound();
  }

  return (
    <ClientShell className="gap-10 py-12">
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
          <Link href={ROUTES.BLOG} className="hover:text-stone-900">
            Blog
          </Link>
          <span className="mx-2">/</span>
          <span>{category.name}</span>
        </p>
        <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2xl:text-5xl">{category.name}</h1>
        <p className="text-sm leading-8 text-stone-600 md:text-base lg:text-lg">
          {category.description ?? "Các bài viết trong danh mục này giúp bạn đi nhanh hơn khi chuẩn bị thiệp cưới và kế hoạch cưới."}
        </p>
      </div>

      <section className="flex flex-wrap items-center gap-3">
        <Link
          href={ROUTES.BLOG}
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-900 transition hover:bg-stone-50 lg:rounded-2xl"
        >
          Tất cả bài viết
        </Link>
        {categories.map((item) => (
          <Link
            key={item.id}
            href={ROUTES.BLOG_PAGES.CATEGORY(item.slug)}
            className={`inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-semibold transition lg:rounded-2xl ${
              item.slug === category.slug
                ? "border border-stone-900 bg-stone-950 text-white"
                : "border border-stone-300 bg-white text-stone-900 hover:bg-stone-50"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </section>

      <section className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </ClientShell>
  );
}
