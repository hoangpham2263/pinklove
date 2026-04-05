import type { Metadata } from"next";

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
};

export function normalizeSlug(slug?: string | string[]): string {
 if (!slug || slug.length === 0) {
 return"home";
 }
 if (Array.isArray(slug)) {
 return slug.join("/");
 }
 return slug;
}

export async function listCmsPages(): Promise<CmsPage[]> {
 // Stub implementation
 return [
 {
  id: 1,
  slug:"home",
  name:"Home Page",
  title:"Welcome to Our Website",
  template:"home",
  status:"published",
  excerpt:"This is the home page mock summary.",
  body:"Welcome to the home page! The backend CMS isn't ready yet, so this is mock data.",
 },
 {
  id: 2,
  slug:"about",
  name:"About Us",
  title:"About Us",
  template:"about",
  status:"published",
  excerpt:"Learn more about us.",
  body:"This is the about us mock data.",
 },
 {
  id: 3,
  slug:"contact",
  name:"Contact Form",
  title:"Contact Us",
  template:"contact",
  status:"published",
  body:"Reach out to us! This is mock data.",
 }
 ];
}

export async function getCmsPageBySlug(slug: string): Promise<CmsPage | null> {
 const pages = await listCmsPages();
 const lookupSlug = slug ==="about-us" ?"about" : slug;
 return pages.find(p => p.slug === lookupSlug) || null;
}

export async function getPublishedCmsPageBySlug(slug: string): Promise<CmsPage | null> {
 const page = await getCmsPageBySlug(slug);
 if (page && page.status ==="published") {
 return page;
 }
 return null;
}

export function buildPageMetadata(page: CmsPage): Metadata {
 return {
 title: page.seoTitle || page.title ||"Pinklove App",
 description: page.seoDescription || page.excerpt ||"",
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
