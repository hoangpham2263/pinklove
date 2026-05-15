import { notFound } from "next/navigation";
import { AdminBackButton } from "@/features/admin/components/admin-buttons";
import { BlogCategoryEditorForm } from "@/features/blog/admin/blog-category-editor-form";
import { requireAdmin } from "@/lib/auth";
import { getBlogCategoryBySlug } from "@/features/blog/server/service";
import { ROUTES } from "@/lib/routes";

export default async function AdminBlogCategoryEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const category = await getBlogCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex items-center gap-3">
        <AdminBackButton href={ROUTES.ADMIN.BLOG_CATEGORIES} destinationLabel="Blog Categories" />
        <h1 className="text-2xl font-bold tracking-tight">Edit Blog Category: {category.name}</h1>
      </div>
      <BlogCategoryEditorForm category={category} />
    </section>
  );
}
