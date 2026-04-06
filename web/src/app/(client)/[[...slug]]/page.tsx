import type { Metadata } from"next";
import { notFound } from"next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { buildPageMetadata, getCmsPageBySlug, getPublishedCmsPageBySlug, normalizeSlug } from"@/lib/cms";
import { PageRenderer } from"@/features/client/PageRenderer";

type DynamicClientPageProps = {
 params: Promise<{ slug?: string[] }>;
 searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

async function getRenderablePage(
 slug: string,
 preview: boolean
) {
 if (!preview) {
  return getPublishedCmsPageBySlug(slug);
 }

 const user = await getCurrentUser();
 if (user?.role !== "admin") {
  return null;
 }

 return getCmsPageBySlug(slug);
}

export async function generateMetadata({ params, searchParams }: DynamicClientPageProps): Promise<Metadata> {
 const resolvedParams = await params;
 const resolvedSearchParams = (await searchParams) ?? {};
 const slug = resolvedParams.slug;
 const page = await getRenderablePage(
  normalizeSlug(slug),
  resolvedSearchParams.preview === "1"
 );
 if (!page) {
 return {};
 }
 return buildPageMetadata(page);
}

export default async function DynamicClientPage({ params, searchParams }: DynamicClientPageProps) {
 const resolvedParams = await params;
 const resolvedSearchParams = (await searchParams) ?? {};
 const slug = resolvedParams.slug;
 const page = await getRenderablePage(
  normalizeSlug(slug),
  resolvedSearchParams.preview === "1"
 );
 if (!page) {
 notFound();
 }

 return <PageRenderer page={page} />;
}
