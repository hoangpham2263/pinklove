import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomeContent } from "@/app/(client)/_components/home-content";
import { PageStructuredData } from "@/components/common/page-structured-data";
import { buildPageMetadata, getAccessibleCmsPageBySlug } from "@/lib/cms";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
  const resolvedSearchParams = (await searchParams) ?? {};
  const page = await getAccessibleCmsPageBySlug("home", {
    preview: resolvedSearchParams.preview === "1",
  });

  return page ? await buildPageMetadata(page) : {};
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const page = await getAccessibleCmsPageBySlug("home", {
    preview: resolvedSearchParams.preview === "1",
  });

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
