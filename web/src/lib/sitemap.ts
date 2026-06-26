import "server-only";

import { readdir } from "node:fs/promises";
import path from "node:path";
import { listPublishedBlogCategories, listPublishedBlogPosts } from "@/features/blog/server/service";
import { listPublishedOfferings } from "@/features/offerings/server/service";
import { listPublishedInvitations } from "@/features/invitations/server/service";
import { listPublishedLandingPages } from "@/features/landing-pages/server/service";
import { listPublishedManagedPagesForSitemap } from "@/lib/managed-pages";
import { getManagedPagePath } from "@/lib/page-paths";
import {
  getBlogCategoryPath,
  getBlogPostPath,
  getInvitationPath,
  getLandingPagePath,
  getOfferingPath,
} from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";
import { type SystemSettings, getSystemSettings } from "@/lib/system-settings";

export type SitemapUrlItem = {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
};

export type SitemapProviderSummary = {
  key: string;
  label: string;
  routePath: string;
  enabled: boolean;
};

type SitemapProvider = {
  key: string;
  label: string;
  routePath: string;
  enabled: (settings: SystemSettings) => boolean;
  getItems: (siteUrl: string) => Promise<SitemapUrlItem[]>;
};

type SitemapIndexItem = {
  loc: string;
  lastmod?: string;
};

function toIsoDate(value?: string | Date) {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function renderSitemapUrlSet(items: SitemapUrlItem[]) {
  const body = items
    .map(
      (item) => `<url><loc>${escapeXml(item.loc)}</loc>${item.lastmod ? `<lastmod>${item.lastmod}</lastmod>` : ""}${
        item.changefreq ? `<changefreq>${item.changefreq}</changefreq>` : ""
      }${item.priority ? `<priority>${item.priority}</priority>` : ""}</url>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export function renderSitemapIndex(items: SitemapIndexItem[]) {
  const body = items
    .map((item) => `<sitemap><loc>${escapeXml(item.loc)}</loc>${item.lastmod ? `<lastmod>${item.lastmod}</lastmod>` : ""}</sitemap>`)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}

async function discoverClientStaticRoutes(): Promise<string[]> {
  const clientRoot = path.join(process.cwd(), "src", "app", "user-site");
  const excludedTopLevelSegments = new Set([
    "checkout",
    "customer",
    "forgot-password",
    "login",
    "payment",
    "provider",
    "register",
    "reset-password",
  ]);
  const discovered = new Set<string>();

  async function walk(currentDir: string, segments: string[]) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith("_")) {
        continue;
      }

      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (segments.length === 0 && excludedTopLevelSegments.has(entry.name)) {
          continue;
        }

        if (entry.name.startsWith("(") && entry.name.endsWith(")")) {
          await walk(fullPath, segments);
          continue;
        }

        if (entry.name.includes("[") || entry.name.includes("]")) {
          continue;
        }

        await walk(fullPath, [...segments, entry.name]);
        continue;
      }

      if (entry.isFile() && entry.name === "page.tsx") {
        const routePath = segments.length === 0 ? "/" : `/${segments.join("/")}`;
        discovered.add(routePath);
      }
    }
  }

  try {
    await walk(clientRoot, []);
  } catch {
    return [];
  }

  return [...discovered];
}

export async function getDiscoveredRouteSitemapItems(siteUrl: string): Promise<SitemapUrlItem[]> {
  const [paths, cmsPages] = await Promise.all([
    discoverClientStaticRoutes(),
    listPublishedManagedPagesForSitemap(),
  ]);
  const managedPaths = new Set(cmsPages.map((page) => getManagedPagePath(page)));

  return paths
    .filter((routePath) => !managedPaths.has(routePath))
    .map((routePath) => ({
      loc: `${siteUrl}${routePath}`,
      changefreq: "weekly",
      priority: routePath === "/" ? "1.0" : "0.6",
    }));
}

export async function getManagedPageSitemapItems(siteUrl: string): Promise<SitemapUrlItem[]> {
  const settings = await getSystemSettings();
  const [pages, discoveredRoutes] = await Promise.all([
    listPublishedManagedPagesForSitemap(),
    settings.sitemap.autoDiscovery && settings.sitemap.includeDiscoveredRoutes
      ? getDiscoveredRouteSitemapItems(siteUrl)
      : Promise.resolve([]),
  ]);

  const pageItems = pages.map((page) => ({
    loc: `${siteUrl}${getManagedPagePath(page)}`,
    lastmod: toIsoDate(page.updatedAt),
    changefreq: page.slug === "home" ? "daily" : "weekly",
    priority: String(page.slug === "home" ? 1 : page.slug === "gioi-thieu" || page.slug === "lien-he" ? 0.8 : 0.7),
  }));

  return [...pageItems, ...discoveredRoutes];
}

export async function getBlogCategorySitemapItems(siteUrl: string): Promise<SitemapUrlItem[]> {
  const categories = await listPublishedBlogCategories();

  return categories.map((category) => ({
    loc: `${siteUrl}${getBlogCategoryPath(category)}`,
    lastmod: toIsoDate(category.updatedAt),
    changefreq: "weekly",
    priority: "0.7",
  }));
}

export async function getBlogPostSitemapItems(siteUrl: string): Promise<SitemapUrlItem[]> {
  const posts = await listPublishedBlogPosts();

  return posts.map((post) => ({
    loc: `${siteUrl}${getBlogPostPath(post)}`,
    lastmod: toIsoDate(post.updatedAt),
    changefreq: "monthly",
    priority: "0.8",
  }));
}

export async function getOfferingSitemapItems(siteUrl: string): Promise<SitemapUrlItem[]> {
  const offerings = await listPublishedOfferings();

  return offerings.map((offering) => ({
    loc: `${siteUrl}${getOfferingPath(offering)}`,
    lastmod: toIsoDate(offering.updatedAt),
    changefreq: "weekly",
    priority: "0.8",
  }));
}

export async function getLandingPageSitemapItems(siteUrl: string): Promise<SitemapUrlItem[]> {
  const landingPages = await listPublishedLandingPages();

  return landingPages.map((landingPage) => ({
    loc: `${siteUrl}${getLandingPagePath(landingPage)}`,
    lastmod: toIsoDate(landingPage.updatedAt),
    changefreq: "weekly",
    priority: "0.8",
  }));
}

export async function getInvitationSiteSitemapItems(siteUrl: string): Promise<SitemapUrlItem[]> {
  const sites = await listPublishedInvitations();

  return sites.map((site) => ({
    loc: `${siteUrl}${getInvitationPath(site)}`,
    lastmod: toIsoDate(site.updatedAt),
    changefreq: "monthly",
    priority: "0.6",
  }));
}

function getSitemapProviders(): SitemapProvider[] {
  return [
    {
      key: "pages",
      label: "Pages",
      routePath: ROUTES.SITEMAP.PAGES,
      enabled: (settings) => settings.sitemap.enabled && settings.sitemap.includeManagedPages,
      getItems: getManagedPageSitemapItems,
    },
    {
      key: "blog-categories",
      label: "Blog Categories",
      routePath: ROUTES.SITEMAP.BLOG_CATEGORIES,
      enabled: (settings) => settings.sitemap.enabled && settings.sitemap.includeBlogCategories,
      getItems: getBlogCategorySitemapItems,
    },
    {
      key: "blog-posts",
      label: "Blog Posts",
      routePath: ROUTES.SITEMAP.BLOG_POSTS,
      enabled: (settings) => settings.sitemap.enabled && settings.sitemap.includeBlogPosts,
      getItems: getBlogPostSitemapItems,
    },
    {
      key: "offerings",
      label: "Offerings",
      routePath: ROUTES.SITEMAP.OFFERINGS,
      enabled: (settings) => settings.sitemap.enabled && settings.sitemap.includeOfferings,
      getItems: getOfferingSitemapItems,
    },
    {
      key: "landing-pages",
      label: "Landing Pages",
      routePath: ROUTES.SITEMAP.LANDING_PAGES,
      enabled: (settings) => settings.sitemap.enabled && settings.sitemap.includeOfferings,
      getItems: getLandingPageSitemapItems,
    },
    {
      key: "invitations",
      label: "Invitations",
      routePath: ROUTES.SITEMAP.INVITATIONS,
      enabled: (settings) => settings.sitemap.enabled && settings.sitemap.includePublicSites,
      getItems: getInvitationSiteSitemapItems,
    },
  ];
}

export async function getSitemapProviderSummaries(): Promise<SitemapProviderSummary[]> {
  const settings = await getSystemSettings();

  return getSitemapProviders().map((provider) => ({
    key: provider.key,
    label: provider.label,
    routePath: provider.routePath,
    enabled: provider.enabled(settings),
  }));
}

export async function getEnabledSitemapIndexItems(siteUrl: string): Promise<SitemapIndexItem[]> {
  const settings = await getSystemSettings();
  const now = new Date().toISOString();

  return getSitemapProviders()
    .filter((provider) => provider.enabled(settings))
    .map((provider) => ({
      loc: `${siteUrl}${provider.routePath}`,
      lastmod: now,
    }));
}

export async function getSitemapItemsByKey(key: string, siteUrl: string): Promise<SitemapUrlItem[]> {
  const settings = await getSystemSettings();
  const normalizedKey =
    key === "wedding-sites" || key === "sites"
      ? "invitations"
      : key === "discovered-routes"
        ? "pages"
        : key;
  const provider = getSitemapProviders().find((item) => item.key === normalizedKey);

  if (!provider || !provider.enabled(settings)) {
    return [];
  }

  return provider.getItems(siteUrl);
}
