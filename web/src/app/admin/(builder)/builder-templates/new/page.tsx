import { ProductBuilderTemplateCreateForm } from "@/features/products/admin/product-builder-template-create-form";
import { listAllProductCategories } from "@/features/products/server/service";
import { ROUTES } from "@/lib/routes";

type AdminBuilderTemplateCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminBuilderTemplateCreatePage({
  searchParams,
}: AdminBuilderTemplateCreatePageProps) {
  const query = (await searchParams) ?? {};
  const returnTo = getQueryValue(query.returnTo) ?? ROUTES.ADMIN.PRODUCT_LIST_BUILDER;
  const categories = await listAllProductCategories();

  return (
    <ProductBuilderTemplateCreateForm
      categories={categories}
      returnTo={returnTo}
    />
  );
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
