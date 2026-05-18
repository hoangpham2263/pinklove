import { getPublishedBlogCategoryBySlug, getPublishedBlogPostBySlug, listPublishedBlogCategories, listPublishedBlogPosts } from "@/features/blog/server/service";
import { getPublicInvitationBySlug } from "@/features/invitations/server/service";
import { getPublishedProductBySlugAndType } from "@/features/products/server/service";
import { getAccessiblePageBySlug, getPageByPath, type ManagedPage } from "@/lib/managed-pages";
import { getManagedPagePath } from "@/lib/page-paths";
import {
  getBlogCategoryPath,
  getBlogPostPath,
  getBuilderProductPath,
  getGeneralProductPath,
  getInvitationPath,
  getTemplateProductPath,
} from "@/lib/public-paths";

export type ResolvedGuestPublicContent =
  | {
      type: "blog-post";
      post: Awaited<ReturnType<typeof getPublishedBlogPostBySlug>> extends infer T ? Exclude<T, null> : never;
    }
  | {
      type: "blog-category";
      category: Awaited<ReturnType<typeof getPublishedBlogCategoryBySlug>> extends infer T ? Exclude<T, null> : never;
      categories: Awaited<ReturnType<typeof listPublishedBlogCategories>>;
      posts: Awaited<ReturnType<typeof listPublishedBlogPosts>>;
    }
  | {
      type: "template-product";
      product: Awaited<ReturnType<typeof getPublishedProductBySlugAndType>> extends infer T ? Exclude<T, null> : never;
    }
  | {
      type: "builder-product";
      product: Awaited<ReturnType<typeof getPublishedProductBySlugAndType>> extends infer T ? Exclude<T, null> : never;
    }
  | {
      type: "general-product";
      product: Awaited<ReturnType<typeof getPublishedProductBySlugAndType>> extends infer T ? Exclude<T, null> : never;
    }
  | {
      type: "invitation";
      invitation: Awaited<ReturnType<typeof getPublicInvitationBySlug>> extends infer T ? Exclude<T, null> : never;
      preview: boolean;
    };

export function getResolvedGuestPathname(slug?: string[]) {
  return `/${(slug ?? []).join("/")}`.replace(/\/{2,}/g, "/");
}

export async function resolveManagedPublicPage(pathname: string, preview: boolean): Promise<ManagedPage | null> {
  const page = await getPageByPath(pathname);

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
  const slug = pathname.split("/").filter(Boolean).at(-1);

  if (!slug) {
    return null;
  }

  const blogPost = await getPublishedBlogPostBySlug(slug);
  if (blogPost && getBlogPostPath(blogPost) === pathname) {
    return { type: "blog-post", post: blogPost };
  }

  const blogCategory = await getPublishedBlogCategoryBySlug(slug);
  if (blogCategory && getBlogCategoryPath(blogCategory) === pathname) {
    const [categories, posts] = await Promise.all([
      listPublishedBlogCategories(),
      listPublishedBlogPosts(blogCategory.slug),
    ]);
    return { type: "blog-category", category: blogCategory, categories, posts };
  }

  const templateProduct = await getPublishedProductBySlugAndType(slug, "coded_template");
  if (templateProduct && getTemplateProductPath(templateProduct) === pathname) {
    return { type: "template-product", product: templateProduct };
  }

  const builderProduct = await getPublishedProductBySlugAndType(slug, "builder");
  if (builderProduct && getBuilderProductPath(builderProduct) === pathname) {
    return { type: "builder-product", product: builderProduct };
  }

  const generalProduct = await getPublishedProductBySlugAndType(slug, "general_product");
  if (generalProduct && getGeneralProductPath(generalProduct) === pathname) {
    return { type: "general-product", product: generalProduct };
  }

  const invitation = await getPublicInvitationBySlug(slug);
  if (invitation && getInvitationPath(invitation) === pathname) {
    return { type: "invitation", invitation, preview };
  }

  return null;
}
