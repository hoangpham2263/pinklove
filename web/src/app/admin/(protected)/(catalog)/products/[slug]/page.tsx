import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getProductBySlug, listAllProductCategories } from "@/features/products/server/service";
import { ProductEditorForm } from "@/features/admin/components/products/product-editor-form";
import { ROUTES } from "@/lib/routes";

type AdminProductEditorPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AdminProductEditorPage({
  params,
}: AdminProductEditorPageProps) {
  await requireAdmin();
  const { slug } = await params;
  const [product, categories] = await Promise.all([getProductBySlug(slug), listAllProductCategories()]);

  if (!product) {
    notFound();
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={ROUTES.ADMIN.PRODUCT_LIST}
            className="inline-flex h-8 items-center justify-center rounded-lg border px-3 font-medium hover:bg-accent"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Edit Product: {product.name}</h1>
        </div>
      </div>
      <ProductEditorForm product={product} categories={categories} />
    </section>
  );
}
