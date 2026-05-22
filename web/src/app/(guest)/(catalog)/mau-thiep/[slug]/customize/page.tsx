import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CodedTemplateCustomizer } from "@/features/offerings/components/coded-template-customizer";
import { getPublishedOfferingBySlugAndType } from "@/features/offerings/server/service";
import {
  getInvitationTemplateDefaults,
  getInvitationTemplateFields,
} from "@/features/invitations/templates/registry";
import { getTemplateOfferingPath } from "@/lib/public-paths";
import { createSeoMetadata } from "@/lib/seo";

type CodedTemplateCustomizePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CodedTemplateCustomizePageProps): Promise<Metadata> {
  const { slug } = await params;
  const offering = await getPublishedOfferingBySlugAndType(slug, "coded_template");

  return createSeoMetadata({
    title: offering ? `Xem trước ${offering.name}` : "Xem trước mẫu thiệp",
    description: offering?.excerpt || "Nhập thông tin để xem trước mẫu thiệp.",
    path: `${getTemplateOfferingPath(slug)}/customize`,
    image: offering?.thumbnailUrl,
    noindex: true,
  });
}

export default async function CodedTemplateCustomizePage({ params }: CodedTemplateCustomizePageProps) {
  const { slug } = await params;
  const offering = await getPublishedOfferingBySlugAndType(slug, "coded_template");
  if (!offering) {
    notFound();
  }

  const initialValues = {
    ...getInvitationTemplateDefaults(offering.templateKey),
    ...((offering.config.siteDefaults as Record<string, unknown> | undefined) ?? {}),
  };

  return (
    <CodedTemplateCustomizer
      offering={offering}
      fields={getInvitationTemplateFields(offering.templateKey)}
      initialValues={initialValues}
    />
  );
}
