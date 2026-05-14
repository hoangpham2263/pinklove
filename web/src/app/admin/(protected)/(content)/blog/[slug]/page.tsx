import { notFound } from "next/navigation";
import { AdminInlineLinkButton } from "@/features/admin/components/admin-buttons";
import { BlogPostEditorForm } from "@/features/blog/admin/blog-post-editor-form";
import { requireAdmin } from "@/lib/auth";
import { getBlogPostBySlug, listAllBlogCategories } from "@/features/blog/server/service";
import { ROUTES } from "@/lib/routes";

type AdminBlogPostEditorPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminBlogPostEditorPage({ params, searchParams }: AdminBlogPostEditorPageProps) {
  await requireAdmin();
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const [post, categories] = await Promise.all([getBlogPostBySlug(slug), listAllBlogCategories()]);

  if (!post) {
    notFound();
  }

  const returnTo = getQueryValue(query.returnTo) ?? ROUTES.ADMIN.BLOG;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AdminInlineLinkButton href={returnTo}>
            ← Back
          </AdminInlineLinkButton>
          <h1 className="text-2xl font-bold tracking-tight">Edit Blog Post: {post.title}</h1>
        </div>
      </div>
      <BlogPostEditorForm post={post} categories={categories} />
    </section>
  );
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
