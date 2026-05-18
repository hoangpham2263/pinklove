import { notFound, redirect } from "next/navigation";
import { listAccountsByRole, requireAdmin } from "@/lib/auth";
import { getProductBySlug, listAllProductCategories } from "@/features/products/server/service";
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
  const [product, categories, vendors] = await Promise.all([
    getProductBySlug(slug),
    listAllProductCategories(),
    listAccountsByRole(USER_ROLES.VENDOR),
  ]);

  if (!product) {
    notFound();
  }

  const returnTo = getQueryValue(query.returnTo) ?? ROUTES.ADMIN.PRODUCT_LIST;

  if (product.productType === "builder_template") {
    redirect(`${ROUTES.ADMIN.BUILDER_EDITOR(product.slug)}?returnTo=${encodeURIComponent(returnTo)}`);
  }

  if (product.productType === "coded_template") {
    redirect(`${ROUTES.ADMIN.CODED_TEMPLATE(product.slug)}?returnTo=${encodeURIComponent(ROUTES.ADMIN.CODED_TEMPLATES)}`);
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {product.productType === "general_product" ? "Edit Product" : "Edit Template"}: {product.name}
          </h1>
        </div>
      </div>
      <ProductEditorForm product={product} categories={categories} vendors={vendors} returnTo={returnTo} />
    </section>
  );
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
