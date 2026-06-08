import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { generateBlogCategoryMetadata, generateBlogPostMetadata, renderBlogCategoryPage, renderBlogPostPage } from "@/features/blog/server/renderers";
import {
  getPublishedBlogCategoryBySlug,
  getPublishedBlogPostBySlug,
  listPublishedBlogCategories,
  listPublishedBlogPosts,
  listRelatedBlogPosts,
} from "@/features/blog/server/service";

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
    const relatedPosts = await listRelatedBlogPosts(post);
    return renderBlogPostPage({ post, relatedPosts });
  }

  const category = await getPublishedBlogCategoryBySlug(slug);

  if (!category) {
    return notFound();
  }

  const [categories, posts] = await Promise.all([
    listPublishedBlogCategories(),
    listPublishedBlogPosts(category.slug),
  ]);

  return renderBlogCategoryPage({ category, categories, posts });
}
