import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CodedTemplateCustomizer } from "@/features/offerings/components/coded-template-customizer";
import { getPublishedDigitalTemplateOfferingBySlug } from "@/features/offerings/server/service";
import {
  getInvitationTemplateDefaults,
  getInvitationTemplateFields,
} from "@/features/invitations/templates/registry";
import { getTemplateOfferingCustomizePath } from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";
import { createSeoMetadata } from "@/lib/seo";

type CodedTemplateCustomizePageProps = {
  params: Promise<{ categorySlug: string; offeringSlug: string }>;
};

async function getOffering(params: CodedTemplateCustomizePageProps["params"]) {
  const { categorySlug, offeringSlug } = await params;
  const offering = await getPublishedDigitalTemplateOfferingBySlug(offeringSlug, "coded");

  if (!offering?.categorySlug || offering.categorySlug !== categorySlug) {
    return null;
  }

  return offering as typeof offering & { categorySlug: string };
}

export async function generateMetadata({ params }: CodedTemplateCustomizePageProps): Promise<Metadata> {
  const offering = await getOffering(params);

  if (!offering) {
    return createSeoMetadata({
      title: "Xem trước mẫu thiệp",
      description: "Mẫu thiệp không tồn tại.",
      path: ROUTES.HOME,
      noindex: true,
    });
  }

  return createSeoMetadata({
    title: `Xem trước ${offering.name}`,
    description: offering.excerpt || "Nhập thông tin để xem trước mẫu thiệp.",
    path: getTemplateOfferingCustomizePath(offering),
    image: offering.thumbnailUrl,
    noindex: true,
  });
}

export default async function CodedTemplateCustomizePage({ params }: CodedTemplateCustomizePageProps) {
  const offering = await getOffering(params);
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
