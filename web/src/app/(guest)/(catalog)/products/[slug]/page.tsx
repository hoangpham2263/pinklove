import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPublishedProductBySlugAndType } from "@/features/products/server/service";
import { generateGeneralProductMetadata, renderGeneralProductPage } from "@/features/products/server/renderers";
import { getGeneralProductPath } from "@/lib/public-paths";

type GeneralProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: GeneralProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProductBySlugAndType(slug, "general_product");
  return await generateGeneralProductMetadata(product);
}

export default async function GeneralProductDetailPage({ params }: GeneralProductDetailPageProps) {
  const { slug } = await params;
  const product = await getPublishedProductBySlugAndType(slug, "general_product");
  if (!product) {
    notFound();
  }

  const targetPath = getGeneralProductPath(product);
  if (targetPath !== `/products/${product.slug}`) {
    redirect(targetPath);
  }

  return renderGeneralProductPage(product);
}
