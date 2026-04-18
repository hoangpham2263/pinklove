import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listAllProducts } from "@/features/products/server/service";
import { getPageBySlug, normalizeSlug } from "@/lib/managed-pages";
import { getManagedPagePath } from "@/lib/page-paths";
import { PageEditorForm } from "@/features/pages/admin/page-editor-form";
import { isAuthPageSlug, isContentPageSlug } from "@/features/pages/config/managed-pages";
import { ROUTES } from "@/lib/routes";

type AdminPageEditorProps = {
  params: Promise<{ slug?: string[] }>;
};

function getPreviewHref(path: string) {
  return path === "/" ? "/?preview=1" : `${path}?preview=1`;
}

export default async function AdminPageEditor({ params }: AdminPageEditorProps) {
  await requireAdmin();
  const { slug: rawSlug } = await params;
  const slug = normalizeSlug(rawSlug);

  if (!isAuthPageSlug(slug) && !isContentPageSlug(slug)) {
    notFound();
  }

  const page = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const previewHref = getPreviewHref(getManagedPagePath(page));
  const products = await listAllProducts();
  const productOptions = products.map((product) => ({
    value: product.slug,
    label: product.name,
    description: `${product.productType === "builder_template" ? "Builder" : "Template"} • ${product.status}`,
  }));

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={ROUTES.ADMIN.PAGES}
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
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <PageEditorForm page={page} productOptions={productOptions} />
    </section>
  );
}
