import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { generateBlogPostMetadata, renderBlogPostPage } from "@/features/blog/server/renderers";
import { getPublishedBlogPostBySlug, listRelatedBlogPosts } from "@/features/blog/server/service";
import { getBlogPostPath } from "@/lib/public-paths";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);
  return await generateBlogPostMetadata(post);
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

  const targetPath = getBlogPostPath(post);
  if (targetPath !== `/blog/post/${post.slug}`) {
    redirect(targetPath);
  }

  const relatedPosts = await listRelatedBlogPosts(post);
  return renderBlogPostPage({ post, relatedPosts });
}
