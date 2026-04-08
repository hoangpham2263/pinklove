import type { Metadata } from "next";
import { ClientShell } from "@/app/(client)/_components/client-ui";
import { PageStructuredData } from "@/components/common/page-structured-data";
import { BlogTabs } from "@/features/blog/components/blog-tabs";
import { listPublishedBlogCategories, listPublishedBlogPosts } from "@/features/blog/server/service";
import { getCurrentUser } from "@/lib/auth";
import { buildPageMetadata, getCmsPageBySlug, getPublishedCmsPageBySlug } from "@/lib/cms";

type BlogPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
  const resolvedSearchParams = (await searchParams) ?? {};
  const preview = resolvedSearchParams.preview === "1";
  const page = preview
    ? (await getCurrentUser())?.role === "admin"
      ? await getCmsPageBySlug("blog")
      : null
    : await getPublishedCmsPageBySlug("blog");

  return page ? await buildPageMetadata(page) : {};
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const preview = resolvedSearchParams.preview === "1";
  const page = preview
    ? (await getCurrentUser())?.role === "admin"
      ? await getCmsPageBySlug("blog")
      : null
    : await getPublishedCmsPageBySlug("blog");
  const [categories, posts] = await Promise.all([
    listPublishedBlogCategories(),
    listPublishedBlogPosts(),
  ]);

  return (
    <ClientShell className="gap-10 py-12">
      <PageStructuredData page={page} />
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
          <span>Trang chủ</span>
          <span className="mx-2">/</span>
          <span>Blog</span>
        </p>
        <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2xl:text-5xl">{page?.title || "Blog cưới"}</h1>
        <p className="text-sm leading-8 text-stone-600 md:text-base lg:text-lg">
          {page?.excerpt || "Chia sẻ kinh nghiệm chọn mẫu thiệp, lên ngân sách cưới, tối ưu nội dung và dùng công cụ đúng lúc để chuẩn bị nhanh hơn."}
        </p>
      </div>

      <BlogTabs categories={categories} posts={posts} />
    </ClientShell>
  );
}
