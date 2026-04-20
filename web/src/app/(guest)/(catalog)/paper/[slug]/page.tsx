import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPublishedProductBySlugAndType } from "@/features/products/server/service";
import { getGeneralProductPath, sanitizePermalinkConfig } from "@/lib/public-paths";
import { getSystemSettings } from "@/lib/system-settings";

type PaperDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PaperDetailPageProps): Promise<Metadata> {
  await params;
  return {};
}

export default async function VendorPaperDetailPage({ params }: PaperDetailPageProps) {
  const { slug } = await params;
  const product = await getPublishedProductBySlugAndType(slug, "general_product");
  if (!product) {
    notFound();
  }

  const settings = await getSystemSettings();
  const permalinkConfig = sanitizePermalinkConfig(settings.permalink);
  redirect(getGeneralProductPath(product, permalinkConfig));
}
