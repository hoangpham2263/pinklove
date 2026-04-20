import Link from "next/link";
import { notFound } from "next/navigation";
import { listAccountsByRole, requireAdmin } from "@/lib/auth";
import { getProductBySlug, listAllProductCategories, listAllProducts } from "@/features/products/server/service";
import { ProductEditorForm } from "@/features/products/admin/product-editor-form";
import { USER_ROLES } from "@/lib/roles";
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
  const [product, categories, products, vendors] = await Promise.all([
    getProductBySlug(slug),
    listAllProductCategories(),
    listAllProducts(),
    listAccountsByRole(USER_ROLES.VENDOR),
  ]);

  if (!product) {
    notFound();
  }

  const returnTo = getQueryValue(query.returnTo) ?? ROUTES.ADMIN.PRODUCT_LIST;

  const usedTemplateKeys = products
    .filter((item) => item.slug !== product.slug)
    .map((item) => item.templateKey);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={returnTo}
            className="inline-flex h-8 items-center justify-center rounded-lg border px-3 font-medium hover:bg-accent"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Edit Product: {product.name}</h1>
        </div>
      </div>
      <ProductEditorForm product={product} categories={categories} usedTemplateKeys={usedTemplateKeys} vendors={vendors} returnTo={returnTo} />
    </section>
  );
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
