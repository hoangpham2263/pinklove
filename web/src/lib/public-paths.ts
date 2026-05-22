import type { BlogCategory, BlogPost } from "@/features/blog/types";
import type { InvitationSite } from "@/features/invitations/types";
import type { Offering } from "@/features/offerings/types";

const BLOG_CATEGORY_BASE = "blog";
const BLOG_CATEGORY_SEGMENT = "category";
const TEMPLATE_BASE = "mau-thiep";
const BUILDER_BASE = "tu-tao-thiep";
const OFFERING_BASE = "thiep-giay";
const INVITATION_BASE = "invitations";

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

export function getBlogCategoryPath(category: Pick<BlogCategory, "slug"> | string) {
  const slug = typeof category === "string" ? category : category.slug;
  return normalizePath(`/${normalizeSegment(BLOG_CATEGORY_BASE)}/${normalizeSegment(BLOG_CATEGORY_SEGMENT)}/${slug}`);
}

export function getBlogPostPath(post: Pick<BlogPost, "slug">) {
  return normalizePath(`/${normalizeSegment(BLOG_CATEGORY_BASE)}/${post.slug}`);
}

export function getTemplateOfferingPath(offering: Pick<Offering, "slug"> | string) {
  const slug = typeof offering === "string" ? offering : offering.slug;
  return normalizePath(`/${normalizeSegment(TEMPLATE_BASE)}/${slug}`);
}

export function getBuilderOfferingPath(offering: Pick<Offering, "slug"> | string) {
  const slug = typeof offering === "string" ? offering : offering.slug;
  return normalizePath(`/${normalizeSegment(BUILDER_BASE)}/${slug}`);
}

export function getGeneralOfferingPath(offering: Pick<Offering, "slug"> | string) {
  const slug = typeof offering === "string" ? offering : offering.slug;
  return normalizePath(`/${normalizeSegment(OFFERING_BASE)}/${slug}`);
}

export function getOfferingPath(offering: Pick<Offering, "slug" | "offeringType" | "templateEngine">) {
  if (offering.offeringType === "digital_template" && offering.templateEngine === "builder") {
    return getBuilderOfferingPath(offering);
  }
  if (offering.offeringType === "physical_product") {
    return getGeneralOfferingPath(offering);
  }
  return getTemplateOfferingPath(offering);
}

export function getInvitationPath(site: Pick<InvitationSite, "slug"> | string) {
  const slug = typeof site === "string" ? site : site.slug;
  return normalizePath(`/${normalizeSegment(INVITATION_BASE)}/${slug}`);
}

export function matchBlogPostPath(pathname: string, post: Pick<BlogPost, "slug">) {
  return getBlogPostPath(post) === normalizePath(pathname);
}
