import { notFound } from "next/navigation";
import { BlogPostEditorForm } from "@/features/blog/admin/blog-post-editor-form";
import { requireAdmin } from "@/lib/auth";
import { getBlogPostBySlug, listAllBlogCategories } from "@/features/blog/server/service";

type AdminBlogPostEditorPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminBlogPostEditorPage({ params }: AdminBlogPostEditorPageProps) {
  await requireAdmin();
  const { slug } = await params;
  const [post, categories] = await Promise.all([getBlogPostBySlug(slug), listAllBlogCategories()]);

  if (!post) {
    notFound();
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Edit Blog Post: {post.title}</h1>
        </div>
      </div>
      <BlogPostEditorForm post={post} categories={categories} />
    </section>
  );
}
