import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPublishedProductBySlugAndType } from "@/features/products/server/service";
import { generateBuilderProductMetadata, renderBuilderProductPage } from "@/features/products/server/renderers";
import { getBuilderProductPath, sanitizePermalinkConfig } from "@/lib/public-paths";
import { getSystemSettings } from "@/lib/system-settings";

type BuilderProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BuilderProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProductBySlugAndType(slug, "builder_template");
  const permalinkConfig = sanitizePermalinkConfig((await getSystemSettings()).permalink);
  return await generateBuilderProductMetadata(product, permalinkConfig);
}

export default async function BuilderProductDetailPage({ params }: BuilderProductDetailPageProps) {
  const { slug } = await params;
  const product = await getPublishedProductBySlugAndType(slug, "builder_template");
  if (!product) {
    notFound();
  }

  const settings = await getSystemSettings();
  const permalinkConfig = sanitizePermalinkConfig(settings.permalink);
  const targetPath = getBuilderProductPath(product, permalinkConfig);
  if (targetPath !== `/builder/${product.slug}`) {
    if (settings.permalink.legacyRedirects) {
      redirect(targetPath);
    }
    notFound();
  }

  return renderBuilderProductPage(product, permalinkConfig);
}
