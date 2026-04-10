import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { generateBlogCategoryMetadata, renderBlogCategoryPage } from "@/features/blog/server/renderers";
import {
  getPublishedBlogCategoryBySlug,
  listPublishedBlogCategories,
  listPublishedBlogPosts,
} from "@/features/blog/server/service";
import { getBlogCategoryPath, sanitizePermalinkConfig } from "@/lib/public-paths";
import { getSystemSettings } from "@/lib/system-settings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getPublishedBlogCategoryBySlug(slug);
  const permalinkConfig = sanitizePermalinkConfig((await getSystemSettings()).permalink);
  return await generateBlogCategoryMetadata(category, permalinkConfig);
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

  const settings = await getSystemSettings();
  const permalinkConfig = sanitizePermalinkConfig(settings.permalink);
  const targetPath = getBlogCategoryPath(category, permalinkConfig);
  if (targetPath !== `/blog/${category.slug}`) {
    if (settings.permalink.legacyRedirects) {
      redirect(targetPath);
    }
    notFound();
  }

  return renderBlogCategoryPage({ category, categories, posts, config: permalinkConfig });
}
