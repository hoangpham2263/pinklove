import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getProductBySlug } from "@/features/products/server/service";
import { ProductEditorForm } from "@/features/admin/components/products/product-editor-form";
import { ROUTES } from "@/lib/routes";

type AdminProductEditorPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminProductEditorPage({
  params,
  searchParams,
}: AdminProductEditorPageProps) {
  await requireAdmin();
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={ROUTES.ADMIN.PRODUCTS}
            className="inline-flex h-8 items-center justify-center rounded-lg border px-3 font-medium hover:bg-accent"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Edit Product: {product.name}</h1>
        </div>
        {query.saved === "1" && (
          <span className="rounded-md border bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
            Changes saved!
          </span>
        )}
        {typeof query.error === "string" && (
          <span className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">
            Error saving product!
          </span>
        )}
      </div>

      <ProductEditorForm product={product} />
    </section>
  );
}
