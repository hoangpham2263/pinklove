import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { listAllProducts } from "@/features/products/server/service";
import type { Product, ProductType } from "@/features/products/types";
import {
  AdminProductList,
  getQueryValue,
} from "@/features/admin/components/products/admin-product-list";
import { ROUTES } from "@/lib/routes";

type AdminProductListPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminProductListPage({
  searchParams,
}: AdminProductListPageProps) {
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Product List</h1>
        <p className="text-sm text-muted-foreground">
          Trang danh sách riêng để lọc, rà soát và quản lý toàn bộ sản phẩm trong hệ thống.
        </p>
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

      <AdminProductList
        products={products}
        search={search}
        status={status}
        productType={productType}
        actionPath={ROUTES.ADMIN.PRODUCT_LIST}
        title="All Products"
      />
    </section>
  );
}
