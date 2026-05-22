import { OfferingBuilderCreateForm } from "@/features/offerings/admin/offering-builder-create-form";
import { listAllOfferingCategories } from "@/features/offerings/server/service";
import { ROUTES } from "@/lib/routes";

type AdminBuilderCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminBuilderCreatePage({
  searchParams,
}: AdminBuilderCreatePageProps) {
  const query = (await searchParams) ?? {};
  const returnTo = getQueryValue(query.returnTo) ?? ROUTES.ADMIN.OFFERING_BUILDER;
  const categories = await listAllOfferingCategories();

  return (
    <OfferingBuilderCreateForm
      categories={categories}
      returnTo={returnTo}
    />
  );
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
