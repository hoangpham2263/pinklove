import { getPublishedBlogCategoryBySlug, getPublishedBlogPostBySlug, listPublishedBlogCategories, listPublishedBlogPosts } from "@/features/blog/server/service";
import { getPublicInvitationBySlug } from "@/features/invitations/server/service";
import { getPublishedProductBySlugAndType } from "@/features/products/server/service";
import { getAccessiblePageBySlug, getPageByPermalink, type ManagedPage } from "@/lib/managed-pages";
import { getManagedPagePath } from "@/lib/page-paths";
import {
  getBlogCategoryPath,
  getBlogPostPath,
  getBuilderProductPath,
  getGeneralProductPath,
  getInvitationPath,
  getTemplateProductPath,
  sanitizePermalinkConfig,
} from "@/lib/public-paths";
import { getSystemSettings } from "@/lib/system-settings";

export type ResolvedGuestPublicContent =
  | {
      type: "blog-post";
      post: Awaited<ReturnType<typeof getPublishedBlogPostBySlug>> extends infer T ? Exclude<T, null> : never;
      config: ReturnType<typeof sanitizePermalinkConfig>;
    }
  | {
      type: "blog-category";
      category: Awaited<ReturnType<typeof getPublishedBlogCategoryBySlug>> extends infer T ? Exclude<T, null> : never;
      categories: Awaited<ReturnType<typeof listPublishedBlogCategories>>;
      posts: Awaited<ReturnType<typeof listPublishedBlogPosts>>;
      config: ReturnType<typeof sanitizePermalinkConfig>;
    }
  | {
      type: "template-product";
      product: Awaited<ReturnType<typeof getPublishedProductBySlugAndType>> extends infer T ? Exclude<T, null> : never;
      config: ReturnType<typeof sanitizePermalinkConfig>;
    }
  | {
      type: "builder-product";
      product: Awaited<ReturnType<typeof getPublishedProductBySlugAndType>> extends infer T ? Exclude<T, null> : never;
      config: ReturnType<typeof sanitizePermalinkConfig>;
    }
  | {
      type: "general-product";
      product: Awaited<ReturnType<typeof getPublishedProductBySlugAndType>> extends infer T ? Exclude<T, null> : never;
      config: ReturnType<typeof sanitizePermalinkConfig>;
    }
  | {
      type: "invitation";
      invitation: Awaited<ReturnType<typeof getPublicInvitationBySlug>> extends infer T ? Exclude<T, null> : never;
      config: ReturnType<typeof sanitizePermalinkConfig>;
      preview: boolean;
    };

export function getResolvedGuestPathname(slug?: string[]) {
  return `/${(slug ?? []).join("/")}`.replace(/\/{2,}/g, "/");
}

export async function resolveManagedPublicPage(pathname: string, preview: boolean): Promise<ManagedPage | null> {
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

export async function resolveGuestPublicContent(
  pathname: string,
  preview: boolean
): Promise<ResolvedGuestPublicContent | null> {
  const settings = await getSystemSettings();
  const permalinkConfig = sanitizePermalinkConfig(settings.permalink);
  const slug = pathname.split("/").filter(Boolean).at(-1);

  if (!slug) {
    return null;
  }

  const blogPost = await getPublishedBlogPostBySlug(slug);
  if (blogPost && getBlogPostPath(blogPost, permalinkConfig) === pathname) {
    return { type: "blog-post", post: blogPost, config: permalinkConfig };
  }

  const blogCategory = await getPublishedBlogCategoryBySlug(slug);
  if (blogCategory && getBlogCategoryPath(blogCategory, permalinkConfig) === pathname) {
    const [categories, posts] = await Promise.all([
      listPublishedBlogCategories(),
      listPublishedBlogPosts(blogCategory.slug),
    ]);
    return { type: "blog-category", category: blogCategory, categories, posts, config: permalinkConfig };
  }

  const templateProduct = await getPublishedProductBySlugAndType(slug, "coded_template");
  if (templateProduct && getTemplateProductPath(templateProduct, permalinkConfig) === pathname) {
    return { type: "template-product", product: templateProduct, config: permalinkConfig };
  }

  const builderProduct = await getPublishedProductBySlugAndType(slug, "builder_template");
  if (builderProduct && getBuilderProductPath(builderProduct, permalinkConfig) === pathname) {
    return { type: "builder-product", product: builderProduct, config: permalinkConfig };
  }

  const generalProduct = await getPublishedProductBySlugAndType(slug, "general_product");
  if (generalProduct && getGeneralProductPath(generalProduct, permalinkConfig) === pathname) {
    return { type: "general-product", product: generalProduct, config: permalinkConfig };
  }

  const invitation = await getPublicInvitationBySlug(slug);
  if (invitation && getInvitationPath(invitation, permalinkConfig) === pathname) {
    return { type: "invitation", invitation, config: permalinkConfig, preview };
  }

  return null;
}
