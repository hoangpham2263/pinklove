import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPublishedLandingPageBySlug,
  listLandingPageSections,
} from "@/features/landing-pages/server/service";
import { renderLandingPage } from "@/features/landing-pages/templates";
import { getOfferingById } from "@/features/offerings/server/service";
import { getLandingPagePath } from "@/lib/public-paths";
import { createSeoMetadata } from "@/lib/seo";

type PublicLandingPageProps = {
  params: Promise<{ slug: string }>;
};

async function getLandingPageContext(slug: string) {
  const landingPage = await getPublishedLandingPageBySlug(slug);
  if (!landingPage?.sourceOfferingId) {
    return null;
  }

  const sourceOffering = await getOfferingById(landingPage.sourceOfferingId);
  if (!sourceOffering) {
    return null;
  }

  return { landingPage, sourceOffering };
}

export async function generateMetadata({ params }: PublicLandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const context = await getLandingPageContext(slug);

  if (!context) {
    return createSeoMetadata({
      title: "Landing page",
      description: "Trang chiến dịch không tồn tại.",
      path: getLandingPagePath(slug),
      noindex: true,
    });
  }

  const { landingPage, sourceOffering } = context;
  return createSeoMetadata({
    title: landingPage.name,
    description: sourceOffering.description || sourceOffering.excerpt || landingPage.name,
    path: getLandingPagePath(landingPage),
    image: sourceOffering.thumbnailUrl,
  });
}

export default async function PublicLandingPage({ params }: PublicLandingPageProps) {
  const { slug } = await params;
  const context = await getLandingPageContext(slug);
  if (!context) {
    notFound();
  }

  const { landingPage, sourceOffering } = context;
  const sections = await listLandingPageSections(landingPage.id);
  const content = renderLandingPage({
    offering: sourceOffering,
    landingPage,
    sections,
  });

  if (!content) {
    notFound();
  }

  return content;
}
