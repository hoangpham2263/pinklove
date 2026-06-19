import type { BlogCategory, BlogPost } from "@/features/blog/types";
import type { InvitationSite } from "@/features/invitations/types";
import type { LandingPage } from "@/features/landing-pages/types";
import type { Offering } from "@/features/offerings/types";
import { ROUTES } from "@/lib/routes";

type CategorizedSlugInput = Pick<Offering, "slug" | "categorySlug">;

function normalizeSegment(input: string) {
  return input
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/{2,}/g, "/");
}

function normalizePath(path: string) {
  const collapsed = path.replace(/\/{2,}/g, "/").trim() || "/";
  let normalized = collapsed.startsWith("/") ? collapsed : `/${collapsed}`;
  if (normalized.length > 1) {
    normalized = normalized.replace(/\/+$/g, "");
  }
  return normalized;
}

function getRequiredCategorySlug(offering: CategorizedSlugInput) {
  const categorySlug = offering.categorySlug?.trim();
  if (!categorySlug) {
    throw new Error(`Offering "${offering.slug}" is missing categorySlug`);
  }
  return normalizeSegment(categorySlug);
}

export function getBlogCategoryPath(category: Pick<BlogCategory, "slug"> | string) {
  const slug = typeof category === "string" ? category : category.slug;
  return normalizePath(ROUTES.BLOG_CATEGORY(normalizeSegment(slug)));
}

export function getBlogPostPath(post: Pick<BlogPost, "slug">) {
  return normalizePath(ROUTES.BLOG_POST(normalizeSegment(post.slug)));
}

export function getTemplateOfferingCustomizePath(offering: CategorizedSlugInput) {
  return normalizePath(
    ROUTES.CATALOG.CUSTOMIZE(normalizeSegment(offering.slug), getRequiredCategorySlug(offering))
  );
}

export function getOfferingPath(offering: CategorizedSlugInput) {
  return normalizePath(
    ROUTES.CATALOG.DETAIL(normalizeSegment(offering.slug), getRequiredCategorySlug(offering))
  );
}

export function getInvitationPath(site: Pick<InvitationSite, "slug"> | string) {
  const slug = typeof site === "string" ? site : site.slug;
  return normalizePath(ROUTES.INVITATIONS.PUBLIC(normalizeSegment(slug)));
}

export function getLandingPagePath(page: Pick<LandingPage, "slug"> | string) {
  const slug = typeof page === "string" ? page : page.slug;
  return ROUTES.LANDING_PAGE(slug);
}

export function matchBlogPostPath(pathname: string, post: Pick<BlogPost, "slug">) {
  return getBlogPostPath(post) === normalizePath(pathname);
}
