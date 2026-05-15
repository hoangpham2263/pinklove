import { notFound, redirect } from "next/navigation";
import { AdminBackButton } from "@/features/admin/components/admin-buttons";
import { listAccountsByRole, requireAdmin } from "@/lib/auth";
import { getProductBySlug, listAllProductCategories } from "@/features/products/server/service";
import { ProductEditorForm } from "@/features/products/admin/product-editor-form";
import { USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

type AdminCodedTemplateEditorPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminCodedTemplateEditorPage({
  params,
  searchParams,
}: AdminCodedTemplateEditorPageProps) {
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

  const returnTo = getQueryValue(query.returnTo) ?? ROUTES.ADMIN.CODED_TEMPLATES;

  if (product.productType === "builder_template") {
    redirect(`${ROUTES.ADMIN.BUILDER_TEMPLATE_EDITOR(product.slug)}?returnTo=${encodeURIComponent(ROUTES.ADMIN.BUILDER_TEMPLATES)}`);
  }

  if (product.productType === "general_product") {
    redirect(`${ROUTES.ADMIN.PRODUCT(product.slug)}?returnTo=${encodeURIComponent(ROUTES.ADMIN.PRODUCT_LIST)}`);
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AdminBackButton href={returnTo} destinationLabel="Coded Templates" />
          <h1 className="text-2xl font-bold tracking-tight">Edit Coded Template: {product.name}</h1>
        </div>
      </div>
      <ProductEditorForm product={product} categories={categories} vendors={vendors} returnTo={returnTo} />
    </section>
  );
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
