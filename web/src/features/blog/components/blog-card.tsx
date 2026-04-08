import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/features/blog/types";
import { ROUTES } from "@/lib/routes";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)] lg:rounded-2xl">
      {post.coverImage ? (
        <Image
          src={post.coverImage}
          alt={post.title}
          width={1600}
          height={1000}
          className="aspect-[16/10] w-full object-cover"
        />
      ) : (
        <div className="aspect-[16/10] bg-[linear-gradient(135deg,#f5eee8_0%,#efe3d8_100%)]" />
      )}
      <div className="space-y-4 px-6 py-6">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-stone-400">
          <Link href={ROUTES.BLOG_PAGES.CATEGORY(post.categorySlug)} className="hover:text-stone-900">
            {post.categoryName}
          </Link>
          <span>{formatDate(post.createdAt)}</span>
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-stone-950 sm:text-2xl lg:text-3xl 2xl:text-4xl">
            <Link href={ROUTES.BLOG_PAGES.POST(post.slug)} className="hover:text-stone-700">
              {post.title}
            </Link>
          </h2>
          <p className="text-sm leading-8 text-stone-600 md:text-base lg:text-lg">{post.excerpt}</p>
        </div>
        <Link
          href={ROUTES.BLOG_PAGES.POST(post.slug)}
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-stone-300 bg-white px-6 text-sm font-semibold text-stone-900 transition hover:bg-stone-50 lg:rounded-2xl"
        >
          Xem bài viết
        </Link>
      </div>
    </article>
  );
}
