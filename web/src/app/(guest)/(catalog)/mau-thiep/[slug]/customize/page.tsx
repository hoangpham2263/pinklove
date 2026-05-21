import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CodedTemplateCustomizer } from "@/features/products/components/coded-template-customizer";
import { getPublishedProductBySlugAndType } from "@/features/products/server/service";
import {
  getInvitationTemplateDefaults,
  getInvitationTemplateFields,
} from "@/features/invitations/templates/registry";
import { getTemplateProductPath } from "@/lib/public-paths";
import { createSeoMetadata } from "@/lib/seo";

type CodedTemplateCustomizePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CodedTemplateCustomizePageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProductBySlugAndType(slug, "coded_template");

  return createSeoMetadata({
    title: product ? `Xem trước ${product.name}` : "Xem trước mẫu thiệp",
    description: product?.excerpt || "Nhập thông tin để xem trước mẫu thiệp.",
    path: `${getTemplateProductPath(slug)}/customize`,
    image: product?.thumbnailUrl,
    noindex: true,
  });
}

export default async function CodedTemplateCustomizePage({ params }: CodedTemplateCustomizePageProps) {
  const { slug } = await params;
  const product = await getPublishedProductBySlugAndType(slug, "coded_template");
  if (!product) {
    notFound();
  }

  const initialValues = {
    ...getInvitationTemplateDefaults(product.templateKey),
    ...((product.config.siteDefaults as Record<string, unknown> | undefined) ?? {}),
  };

  return (
    <CodedTemplateCustomizer
      product={product}
      fields={getInvitationTemplateFields(product.templateKey)}
      initialValues={initialValues}
    />
  );
}
