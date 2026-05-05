import { requireAdmin } from "@/lib/auth";
import { AdminProductsPageView } from "@/features/products/admin/admin-products-page";
import { ROUTES } from "@/lib/routes";

type AdminGeneralProductsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminGeneralProductsPage({ searchParams }: AdminGeneralProductsPageProps) {
  await requireAdmin();
  const query = (await searchParams) ?? {};

  return (
    <AdminProductsPageView
      query={query}
      fixedProductType="general_product"
      title="Quản lý sản phẩm"
      description=""
      returnTo={ROUTES.ADMIN.PRODUCT_LIST_GENERAL}
    />
  );
}
