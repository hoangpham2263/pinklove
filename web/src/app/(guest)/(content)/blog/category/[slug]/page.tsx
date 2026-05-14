import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { generateBlogCategoryMetadata, renderBlogCategoryPage } from "@/features/blog/server/renderers";
import {
  getPublishedBlogCategoryBySlug,
  listPublishedBlogCategories,
  listPublishedBlogPosts,
} from "@/features/blog/server/service";
import { getBlogCategoryPath } from "@/lib/public-paths";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getPublishedBlogCategoryBySlug(slug);
  return await generateBlogCategoryMetadata(category);
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

  const targetPath = getBlogCategoryPath(category);
  if (targetPath !== `/blog/category/${category.slug}`) {
    redirect(targetPath);
  }

  return renderBlogCategoryPage({ category, categories, posts });
}
