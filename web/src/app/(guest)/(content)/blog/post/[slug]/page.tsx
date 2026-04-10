import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { generateBlogPostMetadata, renderBlogPostPage } from "@/features/blog/server/renderers";
import { getPublishedBlogPostBySlug, listRelatedBlogPosts } from "@/features/blog/server/service";
import { getBlogPostPath, sanitizePermalinkConfig } from "@/lib/public-paths";
import { getSystemSettings } from "@/lib/system-settings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);
  const permalinkConfig = sanitizePermalinkConfig((await getSystemSettings()).permalink);
  return await generateBlogPostMetadata(post, permalinkConfig);
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

  const settings = await getSystemSettings();
  const permalinkConfig = sanitizePermalinkConfig(settings.permalink);
  const targetPath = getBlogPostPath(post, permalinkConfig);
  if (targetPath !== `/blog/post/${post.slug}`) {
    if (settings.permalink.legacyRedirects) {
      redirect(targetPath);
    }
    notFound();
  }

  const relatedPosts = await listRelatedBlogPosts(post);
  return renderBlogPostPage({ post, relatedPosts, config: permalinkConfig });
}
