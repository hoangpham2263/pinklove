import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPublishedDigitalTemplateOfferingBySlug } from "@/features/offerings/server/service";
import { generateTemplateOfferingMetadata, renderTemplateOfferingPage } from "@/features/offerings/server/renderers";
import { getTemplateOfferingPath } from "@/lib/public-paths";

type TemplateDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: TemplateDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const offering = await getPublishedDigitalTemplateOfferingBySlug(slug, "coded");
  return await generateTemplateOfferingMetadata(offering);
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const { slug } = await params;
  const offering = await getPublishedDigitalTemplateOfferingBySlug(slug, "coded");
  if (!offering) {
    notFound();
  }

  const targetPath = getTemplateOfferingPath(offering);
  if (targetPath !== `/mau-thiep/${offering.slug}`) {
    redirect(targetPath);
  }

  return renderTemplateOfferingPage(offering);
}
