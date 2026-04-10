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
import { getPublishedProductBySlugAndType } from "@/features/products/server/service";
import { generateBuilderProductMetadata, generateTemplateProductMetadata, renderBuilderProductPage, renderTemplateProductPage } from "@/features/products/server/renderers";
import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { generateManagedPageMetadata, renderManagedPage } from "@/features/pages/server/managed-page-renderer";
import { getPublicInvitationBySlug } from "@/features/invitations/server/service";
import { renderInvitationSite } from "@/features/invitations/templates/renderers";
import { getAccessiblePageBySlug, getPageByPermalink } from "@/lib/managed-pages";
import { getManagedPagePath } from "@/lib/page-paths";
import {
  getBlogCategoryPath,
  getBlogPostPath,
  getBuilderProductPath,
  getInvitationPath,
  getTemplateProductPath,
  sanitizePermalinkConfig,
} from "@/lib/public-paths";
import { getSystemSettings } from "@/lib/system-settings";

type DynamicManagedPageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

async function resolvePage(pathname: string, preview: boolean) {
  const page = await getPageByPermalink(pathname);

  if (!page) {
    return null;
  }

  const accessiblePage = await getAccessiblePageBySlug(page.slug, { preview });

  if (!accessiblePage || getManagedPagePath(accessiblePage) !== pathname) {
    return null;
  }

  return accessiblePage;
}

async function resolvePublicContent(pathname: string, preview: boolean) {
  const settings = await getSystemSettings();
  const permalinkConfig = sanitizePermalinkConfig(settings.permalink);
  const slug = pathname.split("/").filter(Boolean).at(-1);

  if (!slug) {
    return null;
  }

  const blogPost = await getPublishedBlogPostBySlug(slug);
  if (blogPost && getBlogPostPath(blogPost, permalinkConfig) === pathname) {
    return { type: "blog-post" as const, post: blogPost, config: permalinkConfig };
  }

  const blogCategory = await getPublishedBlogCategoryBySlug(slug);
  if (blogCategory && getBlogCategoryPath(blogCategory, permalinkConfig) === pathname) {
    const [categories, posts] = await Promise.all([
      listPublishedBlogCategories(),
      listPublishedBlogPosts(blogCategory.slug),
    ]);
    return { type: "blog-category" as const, category: blogCategory, categories, posts, config: permalinkConfig };
  }

  const templateProduct = await getPublishedProductBySlugAndType(slug, "coded_template");
  if (templateProduct && getTemplateProductPath(templateProduct, permalinkConfig) === pathname) {
    return { type: "template-product" as const, product: templateProduct, config: permalinkConfig };
  }

  const builderProduct = await getPublishedProductBySlugAndType(slug, "builder_template");
  if (builderProduct && getBuilderProductPath(builderProduct, permalinkConfig) === pathname) {
    return { type: "builder-product" as const, product: builderProduct, config: permalinkConfig };
  }

  const invitation = await getPublicInvitationBySlug(slug);
  if (invitation && getInvitationPath(invitation, permalinkConfig) === pathname) {
    return { type: "invitation" as const, invitation, config: permalinkConfig, preview };
  }

  return null;
}

export async function generateMetadata({ params, searchParams }: DynamicManagedPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const pathname = `/${(resolvedParams.slug ?? []).join("/")}`.replace(/\/{2,}/g, "/");
  const page = await resolvePage(pathname, resolvedSearchParams.preview === "1");

  if (page) {
    return generateManagedPageMetadata(page.slug, searchParams);
  }

  const resolvedContent = await resolvePublicContent(pathname, resolvedSearchParams.preview === "1");

  if (!resolvedContent) {
    return {};
  }

  switch (resolvedContent.type) {
    case "blog-post":
      return generateBlogPostMetadata(resolvedContent.post, resolvedContent.config);
    case "blog-category":
      return generateBlogCategoryMetadata(resolvedContent.category, resolvedContent.config);
    case "template-product":
      return generateTemplateProductMetadata(resolvedContent.product, resolvedContent.config);
    case "builder-product":
      return generateBuilderProductMetadata(resolvedContent.product, resolvedContent.config);
    default:
      return {};
  }
}

export default async function DynamicManagedPage({ params, searchParams }: DynamicManagedPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const pathname = `/${(resolvedParams.slug ?? []).join("/")}`.replace(/\/{2,}/g, "/");
  const page = await resolvePage(pathname, resolvedSearchParams.preview === "1");

  if (page) {
    return renderManagedPage(page);
  }

  const resolvedContent = await resolvePublicContent(pathname, resolvedSearchParams.preview === "1");

  if (!resolvedContent) {
    notFound();
  }

  switch (resolvedContent.type) {
    case "blog-post": {
      const relatedPosts = await listRelatedBlogPosts(resolvedContent.post);
      return renderBlogPostPage({ post: resolvedContent.post, relatedPosts, config: resolvedContent.config });
    }
    case "blog-category":
      return renderBlogCategoryPage({
        category: resolvedContent.category,
        categories: resolvedContent.categories,
        posts: resolvedContent.posts,
        config: resolvedContent.config,
      });
    case "template-product":
      return renderTemplateProductPage(resolvedContent.product, resolvedContent.config);
    case "builder-product":
      return renderBuilderProductPage(resolvedContent.product, resolvedContent.config);
    case "invitation": {
      const { invitation } = resolvedContent;
      if (invitation.status !== "published") {
        const user = await getCurrentUser();
        if (!resolvedSearchParams.preview || (!user || (user.id !== invitation.userId && !isAdminRole(user.role)))) {
          notFound();
        }
      }
      return renderInvitationSite(invitation);
    }
    default:
      notFound();
  }
}
