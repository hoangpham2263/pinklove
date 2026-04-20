import type { BlogCategory, BlogPost } from "@/features/blog/types";
import type { InvitationSite } from "@/features/invitations/types";
import type { Product } from "@/features/products/types";

export const ALLOWED_BLOG_POST_PATTERNS = [
  "/blog/post/%postname%",
  "/%year%/%monthnum%/%postname%",
  "/tin-tuc/%postname%",
  "/blog/%year%/%monthnum%/%postname%",
] as const;

export type BlogPostPattern = (typeof ALLOWED_BLOG_POST_PATTERNS)[number];

export type PublicPermalinkConfig = Pick<
  {
    enforceLeadingSlash: boolean;
    stripTrailingSlash: boolean;
    blogPostPattern: string;
    blogCategoryBase: string;
    templateBase: string;
    builderBase: string;
    productBase: string;
    invitationBase: string;
  },
  "enforceLeadingSlash" | "stripTrailingSlash" | "blogPostPattern" | "blogCategoryBase" | "templateBase" | "builderBase" | "productBase" | "invitationBase"
>;

function normalizeSegment(input: string) {
  return input
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/{2,}/g, "/");
}

function normalizePath(path: string, config: Pick<PublicPermalinkConfig, "enforceLeadingSlash" | "stripTrailingSlash">) {
  const collapsed = path.replace(/\/{2,}/g, "/").trim() || "/";
  let normalized = collapsed.startsWith("/") ? collapsed : `/${collapsed}`;

  if (config.stripTrailingSlash && normalized.length > 1) {
    normalized = normalized.replace(/\/+$/g, "");
  }

  if (config.enforceLeadingSlash && !normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  return normalized;
}

function formatDateParts(value: string) {
  const date = new Date(value);
  const year = String(date.getUTCFullYear());
  const monthnum = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return {
    year,
    monthnum,
    day,
  };
}

export function normalizeBlogPostPattern(input: string) {
  const normalized = normalizePath(input || ALLOWED_BLOG_POST_PATTERNS[0], {
    enforceLeadingSlash: true,
    stripTrailingSlash: true,
  });

  return (ALLOWED_BLOG_POST_PATTERNS.includes(normalized as BlogPostPattern)
    ? normalized
    : ALLOWED_BLOG_POST_PATTERNS[0]) as BlogPostPattern;
}

export function sanitizePermalinkConfig(input: PublicPermalinkConfig): PublicPermalinkConfig {
  return {
    enforceLeadingSlash: input.enforceLeadingSlash,
    stripTrailingSlash: input.stripTrailingSlash,
    blogPostPattern: normalizeBlogPostPattern(input.blogPostPattern),
    blogCategoryBase: normalizeSegment(input.blogCategoryBase) || "blog",
    templateBase: normalizeSegment(input.templateBase) || "templates",
    builderBase: normalizeSegment(input.builderBase) || "builder",
    productBase: normalizeSegment(input.productBase) || "products",
    invitationBase: normalizeSegment(input.invitationBase) || "invitations",
  };
}

export function getBlogCategoryPath(category: Pick<BlogCategory, "slug"> | string, input: PublicPermalinkConfig) {
  const config = sanitizePermalinkConfig(input);
  const slug = typeof category === "string" ? category : category.slug;
  return normalizePath(`/${config.blogCategoryBase}/${slug}`, config);
}

export function getBlogPostPath(post: Pick<BlogPost, "slug" | "createdAt">, input: PublicPermalinkConfig) {
  const config = sanitizePermalinkConfig(input);
  const { year, monthnum, day } = formatDateParts(post.createdAt);
  const path = config.blogPostPattern
    .replaceAll("%year%", year)
    .replaceAll("%monthnum%", monthnum)
    .replaceAll("%day%", day)
    .replaceAll("%postname%", post.slug);

  return normalizePath(path, config);
}

export function getTemplateProductPath(product: Pick<Product, "slug"> | string, input: PublicPermalinkConfig) {
  const config = sanitizePermalinkConfig(input);
  const slug = typeof product === "string" ? product : product.slug;
  return normalizePath(`/${config.templateBase}/${slug}`, config);
}

export function getBuilderProductPath(product: Pick<Product, "slug"> | string, input: PublicPermalinkConfig) {
  const config = sanitizePermalinkConfig(input);
  const slug = typeof product === "string" ? product : product.slug;
  return normalizePath(`/${config.builderBase}/${slug}`, config);
}

export function getGeneralProductPath(product: Pick<Product, "slug"> | string, input: PublicPermalinkConfig) {
  const config = sanitizePermalinkConfig(input);
  const slug = typeof product === "string" ? product : product.slug;
  return normalizePath(`/${config.productBase}/${slug}`, config);
}

export function getProductPath(
  product: Pick<Product, "slug" | "productType">,
  input: PublicPermalinkConfig
) {
  if (product.productType === "builder_template") {
    return getBuilderProductPath(product, input);
  }
  if (product.productType === "general_product") {
    return getGeneralProductPath(product, input);
  }
  return getTemplateProductPath(product, input);
}

export function getInvitationPath(site: Pick<InvitationSite, "slug"> | string, input: PublicPermalinkConfig) {
  const config = sanitizePermalinkConfig(input);
  const slug = typeof site === "string" ? site : site.slug;
  return normalizePath(`/${config.invitationBase}/${slug}`, config);
}

export function matchBlogPostPath(
  pathname: string,
  post: Pick<BlogPost, "slug" | "createdAt">,
  input: PublicPermalinkConfig
) {
  return getBlogPostPath(post, input) === normalizePath(pathname, sanitizePermalinkConfig(input));
}
