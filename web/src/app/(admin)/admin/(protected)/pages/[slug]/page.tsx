import { notFound } from "next/navigation";
import Link from "next/link";
import { Eye } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getCmsPageBySlug } from "@/lib/cms";
import { PageEditorForm } from "@/features/admin/components/page-editor-form";

type AdminPageEditorProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPageEditor({ params, searchParams }: AdminPageEditorProps) {
  await requireAdmin();
  const { slug } = await params;
  const page = await getCmsPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const query = (await searchParams) ?? {};
  const isSaved = query.saved === "1";
  const hasError = typeof query.error === "string";
  const previewHref =
    page.slug === "home"
      ? "/?preview=1"
      : page.slug === "login" || page.slug === "register"
        ? `/user/${page.slug}`
        : `/${page.slug}?preview=1`;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/pages"
            className="inline-flex h-8 items-center justify-center rounded-lg border px-3 font-medium hover:bg-accent"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Edit Page: {page.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={previewHref}
            target="_blank"
            title="Xem trang"
            aria-label="Xem trang"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-accent"
          >
            <Eye className="h-4 w-4" />
          </Link>
          {isSaved && (
            <span className="rounded-md border bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
              Changes saved!
            </span>
          )}
          {hasError && (
            <span className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">
              Error saving changes!
            </span>
          )}
        </div>
      </div>

      <PageEditorForm page={page} isSaved={isSaved} hasError={hasError} />
    </section>
  );
}
