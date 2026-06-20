export const PUBLIC_SITE_ROUTES = Object.freeze({
  HOME: "/",
  ABOUT: "/gioi-thieu",
  CONTACT: "/lien-he",
  TEMPLATES: "/mau-thiep",
  PAPER: "/thiep-giay",
  BUILDER: "/customer/invitations",
  WISHLIST: "/wishlist",
  SEARCH: "/search",
  SERVICES: "/dich-vu",
  AFFILIATE_APPLY: "/affiliates",
  BLOG: "/blog",
  LANDING_PAGES: "/landing",
});

export const PUBLIC_ROUTE_BASES = Object.freeze({
  BLOG: PUBLIC_SITE_ROUTES.BLOG,
  INVITATIONS: "/invitations",
  LANDING_PAGES: PUBLIC_SITE_ROUTES.LANDING_PAGES,
});

export function buildOfferingPath(slug, categorySlug) {
  if (!categorySlug) {
    throw new Error(`Offering "${slug}" is missing categorySlug`);
  }
  return `/${categorySlug}/${slug}`;
}

export function buildOfferingCustomizePath(slug, categorySlug) {
  return `${buildOfferingPath(slug, categorySlug)}/customize`;
}

export function buildBlogPath(slug) {
  return `${PUBLIC_ROUTE_BASES.BLOG}/${slug}`;
}

export function buildInvitationPath(slug) {
  return `${PUBLIC_ROUTE_BASES.INVITATIONS}/${slug}`;
}

export function buildLandingPagePath(slug) {
  return `${PUBLIC_ROUTE_BASES.LANDING_PAGES}/${encodeURIComponent(slug)}`;
}
