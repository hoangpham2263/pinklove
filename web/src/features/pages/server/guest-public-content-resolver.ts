import { getPublishedBlogCategoryBySlug, getPublishedBlogPostBySlug, listPublishedBlogCategories, listPublishedBlogPosts } from "@/features/blog/server/service";
import { getPublicInvitationBySlug } from "@/features/invitations/server/service";
import { getPublishedOfferingBySlugAndType } from "@/features/offerings/server/service";
import { getAccessiblePageBySlug, getPageByPath, type ManagedPage } from "@/lib/managed-pages";
import { getManagedPagePath } from "@/lib/page-paths";
import {
  getBlogCategoryPath,
  getBlogPostPath,
  getBuilderOfferingPath,
  getGeneralOfferingPath,
  getInvitationPath,
  getTemplateOfferingPath,
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
      type: "template-offering";
      offering: Awaited<ReturnType<typeof getPublishedOfferingBySlugAndType>> extends infer T ? Exclude<T, null> : never;
    }
  | {
      type: "builder-offering";
      offering: Awaited<ReturnType<typeof getPublishedOfferingBySlugAndType>> extends infer T ? Exclude<T, null> : never;
    }
  | {
      type: "general-offering";
      offering: Awaited<ReturnType<typeof getPublishedOfferingBySlugAndType>> extends infer T ? Exclude<T, null> : never;
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

  const templateOffering = await getPublishedOfferingBySlugAndType(slug, "coded_template");
  if (templateOffering && getTemplateOfferingPath(templateOffering) === pathname) {
    return { type: "template-offering", offering: templateOffering };
  }

  const builderOffering = await getPublishedOfferingBySlugAndType(slug, "builder");
  if (builderOffering && getBuilderOfferingPath(builderOffering) === pathname) {
    return { type: "builder-offering", offering: builderOffering };
  }

  const generalOffering = await getPublishedOfferingBySlugAndType(slug, "general_offering");
  if (generalOffering && getGeneralOfferingPath(generalOffering) === pathname) {
    return { type: "general-offering", offering: generalOffering };
  }

  const invitation = await getPublicInvitationBySlug(slug);
  if (invitation && getInvitationPath(invitation) === pathname) {
    return { type: "invitation", invitation, preview };
  }

  return null;
}
