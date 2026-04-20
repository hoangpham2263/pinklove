import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPublishedProductBySlugAndType } from "@/features/products/server/service";
import { generateGeneralProductMetadata, renderGeneralProductPage } from "@/features/products/server/renderers";
import { getGeneralProductPath, sanitizePermalinkConfig } from "@/lib/public-paths";
import { getSystemSettings } from "@/lib/system-settings";

type GeneralProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: GeneralProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProductBySlugAndType(slug, "general_product");
  const permalinkConfig = sanitizePermalinkConfig((await getSystemSettings()).permalink);
  return await generateGeneralProductMetadata(product, permalinkConfig);
}

export default async function GeneralProductDetailPage({ params }: GeneralProductDetailPageProps) {
  const { slug } = await params;
  const product = await getPublishedProductBySlugAndType(slug, "general_product");
  if (!product) {
    notFound();
  }

  const settings = await getSystemSettings();
  const permalinkConfig = sanitizePermalinkConfig(settings.permalink);
  const targetPath = getGeneralProductPath(product, permalinkConfig);
  if (targetPath !== `/products/${product.slug}`) {
    if (settings.permalink.legacyRedirects) {
      redirect(targetPath);
    }
    notFound();
  }

  return renderGeneralProductPage(product, permalinkConfig);
}
