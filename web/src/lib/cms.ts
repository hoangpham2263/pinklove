import type { Metadata } from "next";
import { query } from "@/lib/db";

export type CmsPage = {
  id?: string | number;
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
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noindex?: boolean;
  nofollow?: boolean;
  customFields?: Record<string, unknown>;
};

type CmsPageRow = {
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
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  noindex: boolean;
  nofollow: boolean;
  custom_fields: Record<string, unknown>;
};

function mapRowToPage(row: CmsPageRow): CmsPage {
  return {
    id: Number(row.id),
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
    ogTitle: row.og_title ?? undefined,
    ogDescription: row.og_description ?? undefined,
    ogImage: row.og_image ?? undefined,
    noindex: row.noindex,
    nofollow: row.nofollow,
    customFields: row.custom_fields ?? {},
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

export async function listCmsPages(): Promise<CmsPage[]> {
  const result = await query<CmsPageRow>(`
    SELECT * FROM cms_pages ORDER BY updated_at DESC
  `);
  
  if (result.rows.length === 0) {
    // Return some default pages if db is empty (for onboarding)
    return [];
  }
  
  return result.rows.map(mapRowToPage);
}

export async function getCmsPageBySlug(slug: string): Promise<CmsPage | null> {
  const result = await query<CmsPageRow>(
    "SELECT * FROM cms_pages WHERE slug = $1 LIMIT 1",
    [slug]
  );
  if (result.rows.length === 0) return null;
  return mapRowToPage(result.rows[0]);
}

export async function getPublishedCmsPageBySlug(slug: string): Promise<CmsPage | null> {
  const page = await getCmsPageBySlug(slug);
  if (page && page.status === "published") {
    return page;
  }
  return null;
}

export async function createCmsPage(data: CmsPage): Promise<CmsPage> {
  const result = await query<CmsPageRow>(
    `
    INSERT INTO cms_pages (
      slug, name, title, excerpt, body, status, template,
      seo_title, seo_description, seo_keywords, canonical_url,
      og_title, og_description, og_image, noindex, nofollow, custom_fields
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
    ) RETURNING *
    `,
    [
      data.slug, data.name, data.title || null, data.excerpt || null, data.body || null,
      data.status || 'draft', data.template || 'default',
      data.seoTitle || null, data.seoDescription || null, data.seoKeywords || null, data.canonicalUrl || null,
      data.ogTitle || null, data.ogDescription || null, data.ogImage || null,
      data.noindex || false, data.nofollow || false, data.customFields || {}
    ]
  );
  return mapRowToPage(result.rows[0]);
}

export async function updateCmsPage(slug: string, data: Partial<CmsPage>): Promise<CmsPage | null> {
  const existing = await getCmsPageBySlug(slug);
  if (!existing) return null;

  const result = await query<CmsPageRow>(
    `
    UPDATE cms_pages SET
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
      og_title = $11,
      og_description = $12,
      og_image = $13,
      noindex = COALESCE($14, noindex),
      nofollow = COALESCE($15, nofollow),
      custom_fields = $16,
      slug = COALESCE($17, slug),
      updated_at = NOW()
    WHERE slug = $18
    RETURNING *
    `,
    [
      data.name, 
      data.title !== undefined ? data.title : existing.title,
      data.excerpt !== undefined ? data.excerpt : existing.excerpt,
      data.body !== undefined ? data.body : existing.body,
      data.status, data.template,
      data.seoTitle !== undefined ? data.seoTitle : existing.seoTitle,
      data.seoDescription !== undefined ? data.seoDescription : existing.seoDescription,
      data.seoKeywords !== undefined ? data.seoKeywords : existing.seoKeywords,
      data.canonicalUrl !== undefined ? data.canonicalUrl : existing.canonicalUrl,
      data.ogTitle !== undefined ? data.ogTitle : existing.ogTitle,
      data.ogDescription !== undefined ? data.ogDescription : existing.ogDescription,
      data.ogImage !== undefined ? data.ogImage : existing.ogImage,
      data.noindex, data.nofollow,
      data.customFields !== undefined ? data.customFields : existing.customFields,
      data.slug, // $17
      slug // $18
    ]
  );
  if (result.rows.length === 0) return null;
  return mapRowToPage(result.rows[0]);
}

export async function deleteCmsPage(slug: string): Promise<boolean> {
  const existing = await getCmsPageBySlug(slug);
  if (!existing) return false;

  const result = await query(
    "DELETE FROM cms_pages WHERE slug = $1 RETURNING id",
    [slug]
  );
  
  return result.rowCount !== null && result.rowCount > 0;
}

export function buildPageMetadata(page: CmsPage): Metadata {
  return {
    title: page.seoTitle || page.title || "Pinklove App",
    description: page.seoDescription || page.excerpt || "",
    keywords: page.seoKeywords ? page.seoKeywords.split(",").map(k => k.trim()) : undefined,
    alternates: page.canonicalUrl ? { canonical: page.canonicalUrl } : undefined,
    robots: {
      index: !page.noindex,
      follow: !page.nofollow,
    },
    openGraph: {
      title: page.ogTitle || page.seoTitle || page.title,
      description: page.ogDescription || page.seoDescription || page.excerpt,
      images: page.ogImage ? [{ url: page.ogImage }] : undefined,
    },
  };
}