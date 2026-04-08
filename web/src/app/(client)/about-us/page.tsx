import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AboutContent } from "@/app/(client)/about-us/_components/about-content";
import { PageStructuredData } from "@/components/common/page-structured-data";
import { buildPageMetadata, getAccessibleCmsPageBySlug } from "@/lib/cms";

type AboutPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: AboutPageProps): Promise<Metadata> {
  const resolvedSearchParams = (await searchParams) ?? {};
  const page = await getAccessibleCmsPageBySlug("about-us", {
    preview: resolvedSearchParams.preview === "1",
  });

  return page ? await buildPageMetadata(page) : {};
}

export default async function AboutPage({ searchParams }: AboutPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const page = await getAccessibleCmsPageBySlug("about-us", {
    preview: resolvedSearchParams.preview === "1",
  });

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
