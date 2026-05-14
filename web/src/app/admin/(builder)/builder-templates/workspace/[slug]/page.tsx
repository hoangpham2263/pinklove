import { notFound, redirect } from "next/navigation";
import { listAccountsByRole } from "@/lib/auth";
import { getProductBySlug, listAllProductCategories } from "@/features/products/server/service";
import { ProductEditorForm } from "@/features/products/admin/product-editor-form";
import { USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

type AdminBuilderTemplateEditorPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminBuilderTemplateEditorPage({
  params,
  searchParams,
}: AdminBuilderTemplateEditorPageProps) {
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

  if (product.productType !== "builder_template") {
    const fallbackHref =
      product.productType === "coded_template"
        ? ROUTES.ADMIN.CODED_TEMPLATE(product.slug)
        : ROUTES.ADMIN.PRODUCT(product.slug);
    redirect(`${fallbackHref}${query.returnTo ? `?returnTo=${encodeURIComponent(getQueryValue(query.returnTo) ?? "")}` : ""}`);
  }

  const returnTo = getQueryValue(query.returnTo) ?? ROUTES.ADMIN.BUILDER_TEMPLATES;

  return <ProductEditorForm product={product} categories={categories} vendors={vendors} returnTo={returnTo} />;
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
