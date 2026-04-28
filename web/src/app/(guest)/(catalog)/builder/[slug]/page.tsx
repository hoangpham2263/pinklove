import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPublishedProductBySlugAndType } from "@/features/products/server/service";
import { generateBuilderProductMetadata, renderBuilderProductPage } from "@/features/products/server/renderers";
import { getBuilderProductPath } from "@/lib/public-paths";

type BuilderProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BuilderProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProductBySlugAndType(slug, "builder_template");
  return await generateBuilderProductMetadata(product);
}

export default async function BuilderProductDetailPage({ params }: BuilderProductDetailPageProps) {
  const { slug } = await params;
  const product = await getPublishedProductBySlugAndType(slug, "builder_template");
  if (!product) {
    notFound();
  }

  const targetPath = getBuilderProductPath(product);
  if (targetPath !== `/builder/${product.slug}`) {
    redirect(targetPath);
  }

  return renderBuilderProductPage(product);
}
