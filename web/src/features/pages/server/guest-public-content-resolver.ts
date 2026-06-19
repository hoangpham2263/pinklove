import { getPublishedBlogCategoryBySlug, getPublishedBlogPostBySlug, listPublishedBlogCategories, listPublishedBlogPosts } from "@/features/blog/server/service";
import { getPublicInvitationBySlug } from "@/features/invitations/server/service";
import { getPublishedDigitalTemplateOfferingBySlug, getPublishedOfferingBySlugAndType } from "@/features/offerings/server/service";
import { getAccessiblePageBySlug, getPageByPath, type ManagedPage } from "@/lib/managed-pages";
import { getManagedPagePath } from "@/lib/page-paths";
import {
  getBlogCategoryPath,
  getBlogPostPath,
  getInvitationPath,
  getOfferingPath,
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
      offering: Awaited<ReturnType<typeof getPublishedDigitalTemplateOfferingBySlug>> extends infer T ? Exclude<T, null> : never;
    }
  | {
      type: "general-offering";
      offering: Awaited<ReturnType<typeof getPublishedDigitalTemplateOfferingBySlug>> extends infer T ? Exclude<T, null> : never;
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

  const templateOffering = await getPublishedDigitalTemplateOfferingBySlug(slug, "coded");
  if (templateOffering && getOfferingPath(templateOffering) === pathname) {
    return { type: "template-offering", offering: templateOffering };
  }

  const builderOffering = await getPublishedDigitalTemplateOfferingBySlug(slug, "builder");
  if (builderOffering && getOfferingPath(builderOffering) === pathname) {
    return { type: "builder-offering", offering: builderOffering };
  }

  const generalOffering = await getPublishedOfferingBySlugAndType(slug, [
    "physical_product",
    "wedding_video",
    "wedding_photo",
    "bridal_makeup",
    "wedding_decoration",
    "wedding_planner",
    "wedding_service",
    "wedding_gift",
  ]);
  if (generalOffering && getOfferingPath(generalOffering) === pathname) {
    return { type: "general-offering", offering: generalOffering };
  }

  const invitation = await getPublicInvitationBySlug(slug);
  if (invitation && getInvitationPath(invitation) === pathname) {
    return { type: "invitation", invitation, preview };
  }

  return null;
}
