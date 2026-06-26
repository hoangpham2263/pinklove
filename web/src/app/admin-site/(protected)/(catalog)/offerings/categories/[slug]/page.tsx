import { notFound } from "next/navigation";
import { OfferingCategoryEditorForm } from "@/features/offerings/admin/offering-category-editor-form";
import { requireAdmin } from "@/lib/auth";
import { getOfferingCategoryBySlug } from "@/features/offerings/server/service";

export default async function AdminOfferingCatEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const category = await getOfferingCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Edit Offering Cat: {category.name}</h1>
      </div>
      <OfferingCategoryEditorForm category={category} />
    </section>
  );
}
