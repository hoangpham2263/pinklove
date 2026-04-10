import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPublishedProductBySlugAndType } from "@/features/products/server/service";
import { generateTemplateProductMetadata, renderTemplateProductPage } from "@/features/products/server/renderers";
import { getTemplateProductPath, sanitizePermalinkConfig } from "@/lib/public-paths";
import { getSystemSettings } from "@/lib/system-settings";

type TemplateDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: TemplateDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProductBySlugAndType(slug, "coded_template");
  const permalinkConfig = sanitizePermalinkConfig((await getSystemSettings()).permalink);
  return await generateTemplateProductMetadata(product, permalinkConfig);
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const { slug } = await params;
  const product = await getPublishedProductBySlugAndType(slug, "coded_template");
  if (!product) {
    notFound();
  }

  const settings = await getSystemSettings();
  const permalinkConfig = sanitizePermalinkConfig(settings.permalink);
  const targetPath = getTemplateProductPath(product, permalinkConfig);
  if (targetPath !== `/templates/${product.slug}`) {
    if (settings.permalink.legacyRedirects) {
      redirect(targetPath);
    }
    notFound();
  }

  return renderTemplateProductPage(product, permalinkConfig);
}
