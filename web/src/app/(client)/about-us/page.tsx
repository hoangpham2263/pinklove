import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AboutContent } from "@/app/(client)/about-us/_components/about-content";
import { PageStructuredData } from "@/components/common/page-structured-data";
import { getCurrentUser } from "@/lib/auth";
import { buildPageMetadata, getCmsPageBySlug, getPublishedCmsPageBySlug } from "@/lib/cms";

type AboutPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: AboutPageProps): Promise<Metadata> {
  const resolvedSearchParams = (await searchParams) ?? {};
  const preview = resolvedSearchParams.preview === "1";
  const page = preview
    ? (await getCurrentUser())?.role === "admin"
      ? await getCmsPageBySlug("about-us")
      : null
    : await getPublishedCmsPageBySlug("about-us");

  return page ? await buildPageMetadata(page) : {};
}

export default async function AboutPage({ searchParams }: AboutPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const preview = resolvedSearchParams.preview === "1";
  const page = preview
    ? (await getCurrentUser())?.role === "admin"
      ? await getCmsPageBySlug("about-us")
      : null
    : await getPublishedCmsPageBySlug("about-us");

  if (!page) {
    notFound();
  }

  return (
    <>
      <PageStructuredData page={page} />
      <AboutContent page={page} />
    </>
  );
}
