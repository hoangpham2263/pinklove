import { requireAdmin } from "@/lib/auth";
import { AdminProductsPageView } from "@/features/products/admin/admin-products-page";
import { ROUTES } from "@/lib/routes";

type AdminBuilderProductsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminBuilderProductsPage({ searchParams }: AdminBuilderProductsPageProps) {
  await requireAdmin();
  const query = (await searchParams) ?? {};

  return (
    <AdminProductsPageView
      query={query}
      fixedProductType="builder_template"
      title="Builder"
      description=""
      returnTo={ROUTES.ADMIN.BUILDER}
    />
  );
}
