import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientPanel, ClientPanelBody, ClientPanelHeader, ClientPanelTitle, ClientShell } from "@/app/(client)/_components/client-ui";
import { JsonLd } from "@/components/common/json-ld";
import { BlogCard } from "@/features/blog/components/blog-card";
import { getPublishedBlogPostBySlug, listRelatedBlogPosts } from "@/features/blog/server/service";
import { ROUTES } from "@/lib/routes";
import { createSeoMetadata } from "@/lib/seo";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function splitParagraphs(content?: string) {
  return (content ?? "").split("\n\n").filter(Boolean);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) {
    return createSeoMetadata({
      title: "Bài viết blog",
      description: "Bài viết blog cưới trên PinkLove.",
      path: ROUTES.BLOG,
      noindex: true,
    });
  }

  return createSeoMetadata({
    title: post.title,
    description: post.excerpt ?? `Đọc bài viết ${post.title} trên blog cưới PinkLove.`,
    path: ROUTES.BLOG_PAGES.POST(post.slug),
    type: "article",
    image: post.coverImage,
    keywords: ["blog cưới", post.categoryName.toLowerCase(), post.title.toLowerCase()],
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) {
    return notFound();
  }

  const relatedPosts = await listRelatedBlogPosts(post);
  const paragraphs = splitParagraphs(post.content);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage ? [post.coverImage] : undefined,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: ROUTES.BLOG_PAGES.POST(post.slug),
    author: {
      "@type": "Organization",
      name: "PinkLove",
    },
    publisher: {
      "@type": "Organization",
      name: "PinkLove",
    },
  };

  return (
    <ClientShell className="gap-10 py-12">
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-4xl space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
          <Link href={ROUTES.BLOG} className="hover:text-stone-900">
            Blog
          </Link>
          <span className="mx-2">/</span>
          <Link href={ROUTES.BLOG_PAGES.CATEGORY(post.categorySlug)} className="hover:text-stone-900">
            {post.categoryName}
          </Link>
        </p>
        <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2xl:text-5xl">{post.title}</h1>
        <p className="text-sm leading-8 text-stone-600 md:text-base lg:text-lg">{post.excerpt}</p>
        <p className="text-xs uppercase tracking-[0.25em] text-stone-400">{formatDate(post.createdAt)}</p>
      </div>

      {post.coverImage ? (
        <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-xl lg:rounded-2xl">
          <Image
            src={post.coverImage}
            alt={post.title}
            width={1600}
            height={900}
            className="min-h-96 w-full object-cover"
          />
        </div>
      ) : (
        <div className="mx-auto min-h-96 w-full max-w-5xl rounded-xl bg-[linear-gradient(135deg,#f4ede7_0%,#ead8c8_100%)] lg:rounded-2xl" />
      )}

      <section className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_320px]">
        <article className="space-y-6">
          {paragraphs.map((paragraph, index) => (
            <p key={`${post.id}-${index}`} className="text-sm leading-8 text-stone-700 md:text-base lg:text-lg">
              {paragraph}
            </p>
          ))}
        </article>

        <aside className="space-y-6">
          <ClientPanel>
            <ClientPanelHeader>
              <ClientPanelTitle>Cùng danh mục</ClientPanelTitle>
            </ClientPanelHeader>
            <ClientPanelBody className="space-y-3">
              <Link
                href={ROUTES.BLOG_PAGES.CATEGORY(post.categorySlug)}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-900 transition hover:bg-stone-50 lg:rounded-2xl"
              >
                Xem danh mục {post.categoryName}
              </Link>
              <Link
                href={ROUTES.TOOLS}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-stone-800 lg:rounded-2xl"
              >
                Xem công cụ hỗ trợ cưới
              </Link>
            </ClientPanelBody>
          </ClientPanel>
        </aside>
      </section>

      {relatedPosts.length ? (
        <section className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Liên quan</p>
            <h2 className="text-xl font-semibold text-stone-950 sm:text-2xl lg:text-3xl 2xl:text-4xl">Bài viết liên quan</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {relatedPosts.map((item) => (
              <BlogCard key={item.id} post={item} />
            ))}
          </div>
        </section>
      ) : null}
    </ClientShell>
  );
}
