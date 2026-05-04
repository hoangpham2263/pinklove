import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { generateBlogCategoryMetadata, generateBlogPostMetadata, renderBlogCategoryPage, renderBlogPostPage } from "@/features/blog/server/renderers";
import { listRelatedBlogPosts } from "@/features/blog/server/service";
import {
  generateBuilderProductMetadata,
  generateGeneralProductMetadata,
  generateTemplateProductMetadata,
  renderBuilderProductPage,
  renderGeneralProductPage,
  renderTemplateProductPage,
} from "@/features/products/server/renderers";
import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { generateManagedPageMetadata, renderManagedPage } from "@/features/pages/server/managed-page-renderer";
import { renderInvitationSite } from "@/features/invitations/templates/renderers";
import {
  getResolvedGuestPathname,
  resolveGuestPublicContent,
  resolveManagedPublicPage,
} from "@/features/pages/server/guest-public-content-resolver";

type DynamicManagedPageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: DynamicManagedPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const pathname = getResolvedGuestPathname(resolvedParams.slug);
  const page = await resolveManagedPublicPage(pathname, resolvedSearchParams.preview === "1");

  if (page) {
    return generateManagedPageMetadata(page.slug, searchParams);
  }

  const resolvedContent = await resolveGuestPublicContent(pathname, resolvedSearchParams.preview === "1");

  if (!resolvedContent) {
    return {};
  }

  switch (resolvedContent.type) {
    case "blog-post":
      return generateBlogPostMetadata(resolvedContent.post);
    case "blog-category":
      return generateBlogCategoryMetadata(resolvedContent.category);
    case "template-product":
      return generateTemplateProductMetadata(resolvedContent.product);
    case "builder-product":
      return generateBuilderProductMetadata(resolvedContent.product);
    case "general-product":
      return generateGeneralProductMetadata(resolvedContent.product);
    default:
      return {};
  }
}

export default async function DynamicManagedPage({ params, searchParams }: DynamicManagedPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const pathname = getResolvedGuestPathname(resolvedParams.slug);
  const page = await resolveManagedPublicPage(pathname, resolvedSearchParams.preview === "1");

  if (page) {
    return renderManagedPage(page, searchParams);
  }

  const resolvedContent = await resolveGuestPublicContent(pathname, resolvedSearchParams.preview === "1");

  if (!resolvedContent) {
    notFound();
  }

  switch (resolvedContent.type) {
    case "blog-post": {
      const relatedPosts = await listRelatedBlogPosts(resolvedContent.post);
      return renderBlogPostPage({ post: resolvedContent.post, relatedPosts });
    }
    case "blog-category":
      return renderBlogCategoryPage({
        category: resolvedContent.category,
        categories: resolvedContent.categories,
        posts: resolvedContent.posts,
      });
    case "template-product":
      return renderTemplateProductPage(resolvedContent.product);
    case "builder-product":
      return renderBuilderProductPage(resolvedContent.product);
    case "general-product":
      return renderGeneralProductPage(resolvedContent.product);
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
