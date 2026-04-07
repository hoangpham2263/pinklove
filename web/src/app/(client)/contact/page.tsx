import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactContent } from "@/app/(client)/contact/_components/contact-content";
import { getCurrentUser } from "@/lib/auth";
import { buildPageMetadata, getCmsPageBySlug, getPublishedCmsPageBySlug } from "@/lib/cms";

type ContactPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: ContactPageProps): Promise<Metadata> {
  const resolvedSearchParams = (await searchParams) ?? {};
  const preview = resolvedSearchParams.preview === "1";
  const page = preview
    ? (await getCurrentUser())?.role === "admin"
      ? await getCmsPageBySlug("contact")
      : null
    : await getPublishedCmsPageBySlug("contact");

  return page ? buildPageMetadata(page) : {};
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const preview = resolvedSearchParams.preview === "1";
  const page = preview
    ? (await getCurrentUser())?.role === "admin"
      ? await getCmsPageBySlug("contact")
      : null
    : await getPublishedCmsPageBySlug("contact");

  if (!page) {
    notFound();
  }

  return <ContactContent page={page} />;
}
