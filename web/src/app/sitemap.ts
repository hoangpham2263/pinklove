import type { MetadataRoute } from "next";
import { listPublishedBlogCategories, listPublishedBlogPosts } from "@/features/blog/server/service";
import { listPublishedProducts } from "@/features/products/server/service";
import { listPublishedWeddingSites } from "@/features/sites/server/service";
import { getSiteUrl } from "@/lib/seo";
import { ROUTES } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const [categories, posts, products, weddingSites] = await Promise.all([
    listPublishedBlogCategories(),
    listPublishedBlogPosts(),
    listPublishedProducts(),
    listPublishedWeddingSites(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    ROUTES.TEMPLATES,
    ROUTES.BUILDER,
    ROUTES.TOOLS,
    ROUTES.SERVICES,
    ROUTES.BLOG,
    "/about-us",
    "/contact",
  ].map((path) => ({
    url: `${siteUrl}${path || "/"}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.8,
  }));

  const blogCategoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${siteUrl}${ROUTES.BLOG_PAGES.CATEGORY(category.slug)}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const blogPostRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}${ROUTES.BLOG_PAGES.POST(post.slug)}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}${
      product.productType === "builder_template"
        ? ROUTES.WEDDING.BUILDER(product.slug)
        : ROUTES.WEDDING.TEMPLATE(product.slug)
    }`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const weddingSiteRoutes: MetadataRoute.Sitemap = weddingSites.map((site) => ({
    url: `${siteUrl}${ROUTES.WEDDING.SITE(site.slug)}`,
    lastModified: new Date(site.updatedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogCategoryRoutes, ...blogPostRoutes, ...productRoutes, ...weddingSiteRoutes];
}
