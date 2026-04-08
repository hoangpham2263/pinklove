import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomeContent } from "@/app/(client)/_components/home-content";
import { PageStructuredData } from "@/components/common/page-structured-data";
import { getCurrentUser } from "@/lib/auth";
import { buildPageMetadata, getCmsPageBySlug, getPublishedCmsPageBySlug } from "@/lib/cms";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
  const resolvedSearchParams = (await searchParams) ?? {};
  const preview = resolvedSearchParams.preview === "1";
  const page = preview
    ? (await getCurrentUser())?.role === "admin"
      ? await getCmsPageBySlug("home")
      : null
    : await getPublishedCmsPageBySlug("home");

  return page ? await buildPageMetadata(page) : {};
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const preview = resolvedSearchParams.preview === "1";
  const page = preview
    ? (await getCurrentUser())?.role === "admin"
      ? await getCmsPageBySlug("home")
      : null
    : await getPublishedCmsPageBySlug("home");

  if (!page) {
    notFound();
  }

  return (
    <>
      <PageStructuredData page={page} />
      <HomeContent page={page} />
    </>
  );
}
