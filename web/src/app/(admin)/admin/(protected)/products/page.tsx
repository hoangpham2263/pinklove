import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageToast } from "@/components/common/page-toast";
import { requireAdmin } from "@/lib/auth";
import { listAllProducts } from "@/features/products/server/service";
import { QuickCreateProductForm } from "@/features/admin/components/products/quick-create-product-form";
import type { Product, ProductType } from "@/features/products/types";
import {
  AdminProductList,
  getQueryValue,
} from "@/features/admin/components/products/admin-product-list";
import { ROUTES } from "@/lib/routes";

type AdminProductsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  await requireAdmin();
  const query = (await searchParams) ?? {};
  const products = await listAllProducts();
  const search = getQueryValue(query.q) ?? "";
  const status = (getQueryValue(query.status) ?? "") as "" | Product["status"];
  const productType = (getQueryValue(query.type) ?? "") as "" | ProductType;
  const publishedCount = products.filter((product) => product.status === "published").length;
  const draftCount = products.length - publishedCount;
  const codedCount = products.filter((product) => product.productType === "coded_template").length;
  const builderCount = products.length - codedCount;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      {query.error === "missing_fields" ? (
        <PageToast message="Thiếu thông tin bắt buộc để tạo hoặc cập nhật sản phẩm." variant="error" />
      ) : null}
      {query.error === "invalid_template" ? (
        <PageToast message="Template không khớp với loại sản phẩm đã chọn." variant="error" />
      ) : null}
      {query.error === "create_failed" ? (
        <PageToast message="Không thể tạo sản phẩm. Hãy kiểm tra lại slug hoặc dữ liệu đầu vào." variant="error" />
      ) : null}
      {query.error === "product_not_found" ? (
        <PageToast message="Không tìm thấy sản phẩm cần thao tác." variant="error" />
      ) : null}
      {query.deleted === "1" ? <PageToast message="Đã xóa sản phẩm." variant="success" /> : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Product</h1>
          <p className="text-sm text-muted-foreground">
            Tạo sản phẩm mới, xem nhanh thống kê và truy cập danh sách sản phẩm để quản lý chi tiết hơn.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tổng sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{products.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{publishedCount}</p>
            <p className="text-sm text-muted-foreground">Draft: {draftCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Coded Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{codedCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Builder Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{builderCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <AdminProductList
          products={products}
          search={search}
          status={status}
          productType={productType}
          actionPath={ROUTES.ADMIN.PRODUCTS}
          title="All Products"
        />

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Create Product</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickCreateProductForm />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
