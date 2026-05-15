import { notFound } from "next/navigation";
import { ProductCategoryEditorForm } from "@/features/products/admin/product-category-editor-form";
import { requireAdmin } from "@/lib/auth";
import { getProductCategoryBySlug } from "@/features/products/server/service";

export default async function AdminProductCatEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const category = await getProductCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Edit Product Cat: {category.name}</h1>
      </div>
      <ProductCategoryEditorForm category={category} />
    </section>
  );
}
