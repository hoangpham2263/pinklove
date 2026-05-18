import type { BlogCategory, BlogPost } from "@/features/blog/types";
import type { InvitationSite } from "@/features/invitations/types";
import type { Product } from "@/features/products/types";

const BLOG_CATEGORY_BASE = "blog";
const BLOG_CATEGORY_SEGMENT = "category";
const TEMPLATE_BASE = "templates";
const BUILDER_BASE = "builder";
const PRODUCT_BASE = "thiep-giay";
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

export function getTemplateProductPath(product: Pick<Product, "slug"> | string) {
  const slug = typeof product === "string" ? product : product.slug;
  return normalizePath(`/${normalizeSegment(TEMPLATE_BASE)}/${slug}`);
}

export function getBuilderProductPath(product: Pick<Product, "slug"> | string) {
  const slug = typeof product === "string" ? product : product.slug;
  return normalizePath(`/${normalizeSegment(BUILDER_BASE)}/${slug}`);
}

export function getGeneralProductPath(product: Pick<Product, "slug"> | string) {
  const slug = typeof product === "string" ? product : product.slug;
  return normalizePath(`/${normalizeSegment(PRODUCT_BASE)}/${slug}`);
}

export function getProductPath(product: Pick<Product, "slug" | "productType">) {
  if (product.productType === "builder") {
    return getBuilderProductPath(product);
  }
  if (product.productType === "general_product") {
    return getGeneralProductPath(product);
  }
  return getTemplateProductPath(product);
}

export function getInvitationPath(site: Pick<InvitationSite, "slug"> | string) {
  const slug = typeof site === "string" ? site : site.slug;
  return normalizePath(`/${normalizeSegment(INVITATION_BASE)}/${slug}`);
}

export function matchBlogPostPath(pathname: string, post: Pick<BlogPost, "slug">) {
  return getBlogPostPath(post) === normalizePath(pathname);
}
