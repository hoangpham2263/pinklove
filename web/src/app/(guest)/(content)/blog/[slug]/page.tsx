import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { generateBlogCategoryMetadata, generateBlogPostMetadata, renderBlogPostPage } from "@/features/blog/server/renderers";
import {
  getPublishedBlogCategoryBySlug,
  getPublishedBlogPostBySlug,
  listRelatedBlogPosts,
} from "@/features/blog/server/service";
import { getBlogCategoryPath, getBlogPostPath } from "@/lib/public-paths";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);
  if (post) {
    return await generateBlogPostMetadata(post);
  }

  const category = await getPublishedBlogCategoryBySlug(slug);
  return await generateBlogCategoryMetadata(category);
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (post) {
    const targetPath = getBlogPostPath(post);
    if (targetPath !== `/blog/${post.slug}`) {
      redirect(targetPath);
    }

    const relatedPosts = await listRelatedBlogPosts(post);
    return renderBlogPostPage({ post, relatedPosts });
  }

  const category = await getPublishedBlogCategoryBySlug(slug);

  if (!category) {
    return notFound();
  }

  permanentRedirect(getBlogCategoryPath(category));
}
