import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/features/blog/types";
import { getBlogCategoryPath, getBlogPostPath } from "@/lib/public-paths";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function BlogCard({
  post,
  postHref = getBlogPostPath(post),
  categoryHref = getBlogCategoryPath(post.categorySlug),
}: {
  post: BlogPost;
  postHref?: string;
  categoryHref?: string;
}) {
  return (
    <article className="group overflow-hidden rounded-[22px] border border-[#f0deee] bg-white shadow-[0_14px_44px_rgba(85,38,82,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(181,41,170,0.12)]">
      <Link href={postHref} className="relative block aspect-[16/10] overflow-hidden bg-[linear-gradient(135deg,#fff2fd_0%,#f1dcf8_100%)]">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,.9),transparent_32%),linear-gradient(135deg,#ffcef7,#ead8ff)]" />
        )}
      </Link>
      <div className="space-y-3 px-5 py-5">
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">
          <Link href={categoryHref} className="hover:text-stone-900">
            {post.categoryName}
          </Link>
          <span className="size-1 rounded-full bg-[#ff6ff5]" />
          <span>{formatDate(post.createdAt)}</span>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-black leading-snug text-stone-950 lg:text-xl">
            <Link href={postHref} className="transition hover:text-[#b529aa]">
              {post.title}
            </Link>
          </h3>
          {post.excerpt ? <p className="line-clamp-2 text-sm leading-6 text-stone-500">{post.excerpt}</p> : null}
        </div>
        <Link
          href={postHref}
          className="inline-flex items-center text-sm font-bold text-[#b529aa] transition hover:text-stone-950"
        >
          Xem bài viết&nbsp; →
        </Link>
      </div>
    </article>
  );
}
