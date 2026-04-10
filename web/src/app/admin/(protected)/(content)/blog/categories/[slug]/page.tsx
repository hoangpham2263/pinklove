import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCategoryEditorForm } from "@/features/admin/components/blog/blog-category-editor-form";
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
        <Link href={ROUTES.ADMIN.BLOG_CATEGORIES} className="inline-flex h-8 items-center justify-center rounded-lg border px-3 font-medium hover:bg-accent">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit Blog Category: {category.name}</h1>
      </div>
      <BlogCategoryEditorForm category={category} />
    </section>
  );
}
