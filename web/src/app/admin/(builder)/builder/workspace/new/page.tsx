import { ProductBuilderCreateForm } from "@/features/products/admin/product-builder-create-form";
import { listAllProductCategories } from "@/features/products/server/service";
import { ROUTES } from "@/lib/routes";

type AdminBuilderCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminBuilderCreatePage({
  searchParams,
}: AdminBuilderCreatePageProps) {
  const query = (await searchParams) ?? {};
  const returnTo = getQueryValue(query.returnTo) ?? ROUTES.ADMIN.BUILDER;
  const categories = await listAllProductCategories();

  return (
    <ProductBuilderCreateForm
      categories={categories}
      returnTo={returnTo}
    />
  );
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
