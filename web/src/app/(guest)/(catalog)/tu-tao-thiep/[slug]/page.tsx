import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPublishedDigitalTemplateOfferingBySlug } from "@/features/offerings/server/service";
import { generateBuilderOfferingMetadata, renderBuilderOfferingPage } from "@/features/offerings/server/renderers";
import { getBuilderOfferingPath } from "@/lib/public-paths";

type BuilderOfferingDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BuilderOfferingDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const offering = await getPublishedDigitalTemplateOfferingBySlug(slug, "builder");
  return await generateBuilderOfferingMetadata(offering);
}

export default async function BuilderOfferingDetailPage({ params }: BuilderOfferingDetailPageProps) {
  const { slug } = await params;
  const offering = await getPublishedDigitalTemplateOfferingBySlug(slug, "builder");
  if (!offering) {
    notFound();
  }

  const targetPath = getBuilderOfferingPath(offering);
  if (targetPath !== `/tu-tao-thiep/${offering.slug}`) {
    redirect(targetPath);
  }

  return renderBuilderOfferingPage(offering);
}
