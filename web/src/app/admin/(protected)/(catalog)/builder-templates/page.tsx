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
      title="Quản lý mẫu builder"
      description="Trang quản lý riêng cho toàn bộ sản phẩm loại builder template."
      returnTo={ROUTES.ADMIN.BUILDER_TEMPLATES}
    />
  );
}
