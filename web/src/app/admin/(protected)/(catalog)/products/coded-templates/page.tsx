import { requireAdmin } from "@/lib/auth";
import { AdminProductsPageView } from "@/features/products/admin/admin-products-page";
import { ROUTES } from "@/lib/routes";

type AdminCodedProductsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminCodedProductsPage({ searchParams }: AdminCodedProductsPageProps) {
  await requireAdmin();
  const query = (await searchParams) ?? {};

  return (
    <AdminProductsPageView
      query={query}
      fixedProductType="coded_template"
      title=""
      description=""
      returnTo={ROUTES.ADMIN.PRODUCT_LIST_CODED}
    />
  );
}
