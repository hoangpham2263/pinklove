import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { generateBlogCategoryMetadata, generateBlogPostMetadata, renderBlogCategoryPage, renderBlogPostPage } from "@/features/blog/server/renderers";
import { listRelatedBlogPosts } from "@/features/blog/server/service";
import {
  generateBuilderOfferingMetadata,
  generateRegisteredOfferingMetadata,
  generateTemplateOfferingMetadata,
  renderBuilderOfferingPage,
  renderRegisteredOfferingPage,
  renderTemplateOfferingPage,
} from "@/features/offerings/server/renderers";
import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { generateManagedPageMetadata, renderManagedPage } from "@/features/pages/server/managed-page-renderer";
import { renderInvitationSite } from "@/features/invitations/templates/renderers";
import {
  getResolvedGuestPathname,
  resolveGuestPublicContent,
  resolveManagedPublicPage,
} from "@/features/pages/server/guest-public-content-resolver";
import { getActiveSeoRedirect } from "@/lib/seo-redirects";

type DynamicManagedPageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: DynamicManagedPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const pathname = getResolvedGuestPathname(resolvedParams.slug);
  const resolvedContent = await resolveGuestPublicContent(pathname, resolvedSearchParams.preview === "1");

  if (resolvedContent) {
    switch (resolvedContent.type) {
      case "blog-post":
        return generateBlogPostMetadata(resolvedContent.post);
      case "blog-category":
        return generateBlogCategoryMetadata(resolvedContent.category);
      case "template-offering":
        return generateTemplateOfferingMetadata(resolvedContent.offering);
      case "builder-offering":
        return generateBuilderOfferingMetadata(resolvedContent.offering);
      case "general-offering":
        return generateRegisteredOfferingMetadata(resolvedContent.offering);
      default:
        return {};
    }
  }

  const page = await resolveManagedPublicPage(pathname, resolvedSearchParams.preview === "1");

  return page ? generateManagedPageMetadata(page.slug, searchParams) : {};
}

export default async function DynamicManagedPage({ params, searchParams }: DynamicManagedPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const pathname = getResolvedGuestPathname(resolvedParams.slug);
  const resolvedContent = await resolveGuestPublicContent(pathname, resolvedSearchParams.preview === "1");

  if (resolvedContent) {
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
      case "template-offering":
        return renderTemplateOfferingPage(resolvedContent.offering);
      case "builder-offering":
        return renderBuilderOfferingPage(resolvedContent.offering);
      case "general-offering":
        return renderRegisteredOfferingPage(resolvedContent.offering);
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

  const page = await resolveManagedPublicPage(pathname, resolvedSearchParams.preview === "1");

  if (page) {
    return renderManagedPage(page, searchParams);
  }

  const redirectRule = await getActiveSeoRedirect(pathname);
  if (redirectRule) {
    if (redirectRule.statusCode === 301) {
      permanentRedirect(redirectRule.targetPath);
    }
    redirect(redirectRule.targetPath);
  }

  notFound();
}
