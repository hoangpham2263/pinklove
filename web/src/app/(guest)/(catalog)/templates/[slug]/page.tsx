import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPublishedProductBySlugAndType } from "@/features/products/server/service";
import { generateTemplateProductMetadata, renderTemplateProductPage } from "@/features/products/server/renderers";
import { getTemplateProductPath } from "@/lib/public-paths";

type TemplateDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: TemplateDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProductBySlugAndType(slug, "coded_template");
  return await generateTemplateProductMetadata(product);
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const { slug } = await params;
  const product = await getPublishedProductBySlugAndType(slug, "coded_template");
  if (!product) {
    notFound();
  }

  const targetPath = getTemplateProductPath(product);
  if (targetPath !== `/templates/${product.slug}`) {
    redirect(targetPath);
  }

  return renderTemplateProductPage(product);
}
