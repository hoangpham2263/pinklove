import type { Metadata } from"next";
import { notFound } from"next/navigation";

import { buildPageMetadata, getPublishedCmsPageBySlug, normalizeSlug } from"@/lib/cms";
import { PageRenderer } from"@/features/client/PageRenderer";

type DynamicClientPageProps = {
 params: Promise<{ slug?: string[] }>;
};

export async function generateMetadata({ params }: DynamicClientPageProps): Promise<Metadata> {
 const resolvedParams = await params;
 const slug = resolvedParams.slug;
 const page = await getPublishedCmsPageBySlug(normalizeSlug(slug));
 if (!page) {
 return {};
 }
 return buildPageMetadata(page);
}

export default async function DynamicClientPage({ params }: DynamicClientPageProps) {
 const resolvedParams = await params;
 const slug = resolvedParams.slug;
 const page = await getPublishedCmsPageBySlug(normalizeSlug(slug));
 if (!page) {
 notFound();
 }

 return <PageRenderer page={page} />;
}
