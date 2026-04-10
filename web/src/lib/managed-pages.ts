import type { Metadata } from "next";
import { listContentPageSlugs } from "@/features/pages/registry";
import { AUTH_PAGES } from "@/features/auth/page-registry";
import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { query, withTransaction } from "@/lib/database";
import { getPageFields, type PageFields } from "@/lib/page-fields";
import { absoluteUrl, getCurrentSiteUrl } from "@/lib/seo";
import { resolveSeoImageUrl } from "@/lib/media-resolver";
import {
  getManagedPagePath,
  getDefaultPagePath,
  isPageExcludedFromSitemap,
  normalizePagePermalinkInput,
} from "@/lib/page-paths";
import { getSystemSettings } from "@/lib/system-settings";

export type ManagedPage = {
  id?: string;
  name: string;
  slug: string;
  title?: string;
  excerpt?: string;
  body?: string;
  status?: string;
  template?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  canonicalUrl?: string;
  permalink?: string;
  breadcrumbTitle?: string;
  breadcrumbParentSlug?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noindex?: boolean;
  nofollow?: boolean;
  customFields?: Record<string, unknown>;
  updatedAt?: string;
};

type ManagedPageRow = {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  excerpt: string | null;
  body: string | null;
  status: string;
  template: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  canonical_url: string | null;
  permalink: string | null;
  breadcrumb_title: string | null;
  breadcrumb_parent_slug: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  noindex: boolean;
  nofollow: boolean;
  custom_fields: Record<string, unknown>;
  updated_at: string;
};

export type ManagedPageBreadcrumbItem = {
  slug: string;
  name: string;
  path: string;
};

type ManagedPageBreadcrumbOptions = {
  homeLabel?: string;
};

function mapRowToPage(row: ManagedPageRow): ManagedPage {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    title: row.title ?? undefined,
    excerpt: row.excerpt ?? undefined,
    body: row.body ?? undefined,
    status: row.status,
    template: row.template,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    seoKeywords: row.seo_keywords ?? undefined,
    canonicalUrl: row.canonical_url ?? undefined,
    permalink: row.permalink ?? undefined,
    breadcrumbTitle: row.breadcrumb_title ?? undefined,
    breadcrumbParentSlug: row.breadcrumb_parent_slug ?? undefined,
    ogTitle: row.og_title ?? undefined,
    ogDescription: row.og_description ?? undefined,
    ogImage: row.og_image ?? undefined,
    noindex: row.noindex,
    nofollow: row.nofollow,
    customFields: row.custom_fields ?? {},
    updatedAt: row.updated_at,
  };
}

export function normalizeSlug(slug?: string | string[]): string {
  if (!slug || slug.length === 0) {
    return "home";
  }
  if (Array.isArray(slug)) {
    return slug.join("/");
  }
  return slug;
}

export async function listPages(): Promise<ManagedPage[]> {
  const result = await query<ManagedPageRow>(`
    SELECT * FROM managed_pages ORDER BY updated_at DESC
  `);

  return result.rows.map(mapRowToPage);
}

export async function listManagedPages(): Promise<ManagedPage[]> {
  const pages = await listPages();
  const managedSlugs = [...Object.keys(AUTH_PAGES), ...listContentPageSlugs()];

  return managedSlugs
    .map((slug) => pages.find((page) => page.slug === slug))
    .filter((page): page is ManagedPage => page !== undefined);
}

export async function getPageBySlug(slug: string): Promise<ManagedPage | null> {
  const result = await query<ManagedPageRow>(
    "SELECT * FROM managed_pages WHERE slug = $1 LIMIT 1",
    [slug]
  );
  if (result.rows.length === 0) return null;
  return mapRowToPage(result.rows[0]);
}

export async function getPageFieldsBySlug<TFields extends PageFields = PageFields>(
  slug: string
): Promise<TFields> {
  const page = await getPageBySlug(slug);
  return getPageFields<TFields>(page);
}

export async function getPublishedPageBySlug(slug: string): Promise<ManagedPage | null> {
  const page = await getPageBySlug(slug);
  if (page && page.status === "published") {
    return page;
  }
  return null;
}

export async function getPageByPermalink(permalink: string): Promise<ManagedPage | null> {
  const normalizedPermalink = normalizePagePermalinkInput(permalink, "temp");
  const result = await query<ManagedPageRow>(
    "SELECT * FROM managed_pages WHERE permalink = $1 LIMIT 1",
    [normalizedPermalink]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToPage(result.rows[0]);
}

type AccessiblePageOptions = {
  preview?: boolean;
  allowAdminDraftAccess?: boolean;
};

export async function getAccessiblePageBySlug(
  slug: string,
  options: AccessiblePageOptions = {}
): Promise<ManagedPage | null> {
  const { preview = false, allowAdminDraftAccess = false } = options;
  const page = await getPageBySlug(slug);

  if (!page) {
    return null;
  }

  if (page.status === "published") {
    return page;
  }

  const user = await getCurrentUser();
  const isAdmin = isAdminRole(user?.role);

  if (!isAdmin) {
    return null;
  }

  if (preview || allowAdminDraftAccess) {
    return page;
  }

  return null;
}

export async function updateManagedPage(slug: string, data: Partial<ManagedPage>): Promise<ManagedPage | null> {
  const existing = await getPageBySlug(slug);
  if (!existing) return null;
  const normalizedTitle =
    data.title !== undefined
      ? data.title?.trim() || data.name?.trim() || existing.name
      : existing.title || data.name?.trim() || existing.name;

  const nextSlug = data.slug ?? existing.slug;
  const nextPermalink = normalizePagePermalinkInput(
    data.permalink ?? existing.permalink ?? getDefaultPagePath(nextSlug),
    nextSlug
  );

  return withTransaction(async (execute) => {
    const result = await execute<ManagedPageRow>(
      `
      UPDATE managed_pages SET
        name = COALESCE($1, name),
        title = $2,
        excerpt = $3,
        body = $4,
        status = COALESCE($5, status),
        template = COALESCE($6, template),
        seo_title = $7,
        seo_description = $8,
        seo_keywords = $9,
        canonical_url = $10,
        permalink = $11,
        breadcrumb_title = $12,
        breadcrumb_parent_slug = $13,
        og_title = $14,
        og_description = $15,
        og_image = $16,
        noindex = COALESCE($17, noindex),
        nofollow = COALESCE($18, nofollow),
        custom_fields = $19,
        slug = COALESCE($20, slug),
        updated_at = NOW()
      WHERE slug = $21
      RETURNING *
      `,
      [
        data.name,
        normalizedTitle,
        data.excerpt !== undefined ? data.excerpt : existing.excerpt,
        data.body !== undefined ? data.body : existing.body,
        data.status,
        data.template,
        data.seoTitle !== undefined ? data.seoTitle : existing.seoTitle,
        data.seoDescription !== undefined ? data.seoDescription : existing.seoDescription,
        data.seoKeywords !== undefined ? data.seoKeywords : existing.seoKeywords,
        data.canonicalUrl !== undefined ? data.canonicalUrl : existing.canonicalUrl,
        nextPermalink,
        data.breadcrumbTitle !== undefined ? data.breadcrumbTitle : existing.breadcrumbTitle,
        data.breadcrumbParentSlug !== undefined ? data.breadcrumbParentSlug : existing.breadcrumbParentSlug,
        data.ogTitle !== undefined ? data.ogTitle : existing.ogTitle,
        data.ogDescription !== undefined ? data.ogDescription : existing.ogDescription,
        data.ogImage !== undefined ? data.ogImage : existing.ogImage,
        data.noindex,
        data.nofollow,
        data.customFields !== undefined ? data.customFields : existing.customFields,
        data.slug,
        slug,
      ]
    );

    if (result.rows.length === 0) {
      return null;
    }

    if (nextSlug !== existing.slug) {
      await execute(
        `
        UPDATE managed_pages
        SET breadcrumb_parent_slug = $1, updated_at = NOW()
        WHERE breadcrumb_parent_slug = $2
        `,
        [nextSlug, existing.slug]
      );

      await execute(
        `
        UPDATE navigation_menu_items
        SET page_slug = $1, updated_at = NOW()
        WHERE page_slug = $2
        `,
        [nextSlug, existing.slug]
      );
    }

    return mapRowToPage(result.rows[0]);
  });
}

export async function buildManagedPageMetadata(page: ManagedPage): Promise<Metadata> {
  const siteUrl = await getCurrentSiteUrl();
  const settings = await getSystemSettings();
  const ogImage = await resolveSeoImageUrl(page.ogImage || settings.opengraph.defaultImage);
  const canonicalUrl = page.canonicalUrl || absoluteUrl(getManagedPagePath(page), siteUrl);
  const canIndex = settings.indexing.siteIndexingEnabled && !page.noindex;
  const ogTitle = page.ogTitle || page.seoTitle || page.title || settings.opengraph.defaultTitle;
  const ogDescription = page.ogDescription || page.seoDescription || page.excerpt || settings.opengraph.defaultDescription;

  return {
    metadataBase: new URL(siteUrl),
    title: page.seoTitle || page.title || "Pinklove App",
    description: page.seoDescription || page.excerpt || "",
    keywords: page.seoKeywords ? page.seoKeywords.split(",").map(k => k.trim()) : undefined,
    alternates: { canonical: canonicalUrl },
    robots: {
      index: canIndex,
      follow: settings.indexing.siteIndexingEnabled && !page.nofollow,
    },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      title: ogTitle,
      description: ogDescription,
      siteName: settings.opengraph.siteName,
      locale: settings.opengraph.locale,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? settings.opengraph.twitterCard : "summary",
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

function getPageBreadcrumbName(page: ManagedPage): string {
  return page.breadcrumbTitle || page.title || page.name;
}

function inferBreadcrumbParentSlug(page: ManagedPage, pageMap: Map<string, ManagedPage>): string | null {
  if (page.breadcrumbParentSlug && page.breadcrumbParentSlug !== page.slug && pageMap.has(page.breadcrumbParentSlug)) {
    return page.breadcrumbParentSlug;
  }

  if (page.slug === "home" || page.slug === "login" || page.slug === "register") {
    return null;
  }

  const slashIndex = page.slug.lastIndexOf("/");
  if (slashIndex > 0) {
    const parentSlug = page.slug.slice(0, slashIndex);
    if (pageMap.has(parentSlug)) {
      return parentSlug;
    }
  }

  return page.slug === "home" ? null : "home";
}

export async function getManagedPageBreadcrumbs(page: ManagedPage, options: ManagedPageBreadcrumbOptions = {}): Promise<ManagedPageBreadcrumbItem[]> {
  const pages = await listPages();
  const pageMap = new Map(pages.map((item) => [item.slug, item]));
  const trail: ManagedPageBreadcrumbItem[] = [];
  const seen = new Set<string>();
  const homeLabel = options.homeLabel?.trim();

  let current: ManagedPage | undefined = page;

  while (current && !seen.has(current.slug) && trail.length < 10) {
    seen.add(current.slug);
    trail.unshift({
      slug: current.slug,
      name: current.slug === "home" && homeLabel ? homeLabel : getPageBreadcrumbName(current),
      path: getManagedPagePath(current),
    });

    const parentSlug = inferBreadcrumbParentSlug(current, pageMap);
    current = parentSlug ? pageMap.get(parentSlug) : undefined;
  }

  return trail;
}

export async function getManagedPageBreadcrumbStructuredData(page: ManagedPage, options: ManagedPageBreadcrumbOptions = {}) {
  const siteUrl = await getCurrentSiteUrl();
  const breadcrumbs = await getManagedPageBreadcrumbs(page, options);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, siteUrl),
    })),
  };
}

export async function listPublishedManagedPagesForSitemap(): Promise<ManagedPage[]> {
  const result = await query<ManagedPageRow>(`
    SELECT *
    FROM managed_pages
    WHERE status = 'published'
      AND noindex = false
    ORDER BY updated_at DESC
  `);

  return result.rows
    .map(mapRowToPage)
    .filter((page) => !isPageExcludedFromSitemap(page.slug));
}
