import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { PageToast } from "@/components/common/page-toast";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { listAllProducts } from "@/features/products/server/service";
import type { Product, ProductType } from "@/features/products/types";
import { AdminProductList } from "@/features/admin/components/products/admin-product-list";
import { ROUTES } from "@/lib/routes";

type AdminProductListPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

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
      {query.error === "product_not_found" ? (
        <PageToast message="Không tìm thấy sản phẩm cần thao tác." variant="error" />
      ) : null}
      {query.error === "missing_slug" ? (
        <PageToast message="Thiếu slug sản phẩm để thực hiện thao tác." variant="error" />
      ) : null}
      {query.error === "missing_selection" ? (
        <PageToast message="Hãy chọn ít nhất một sản phẩm để áp dụng thao tác hàng loạt." variant="error" />
      ) : null}
      {query.error === "invalid_bulk_action" ? (
        <PageToast message="Tác vụ hàng loạt không hợp lệ." variant="error" />
      ) : null}
      {query.deleted === "1" ? <PageToast message="Đã xóa sản phẩm." variant="success" /> : null}
      {query.bulk === "publish" ? (
        <PageToast message={`${String(query.count ?? "0")} sản phẩm đã chuyển sang Published.`} variant="success" />
      ) : null}
      {query.bulk === "draft" ? (
        <PageToast message={`${String(query.count ?? "0")} sản phẩm đã chuyển sang Draft.`} variant="success" />
      ) : null}
      {query.bulk === "deleted" ? (
        <PageToast message={`${String(query.count ?? "0")} sản phẩm đã bị xóa.`} variant="success" />
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh sách sản phẩm</h1>
        </div>
        <Button render={<Link href={ROUTES.ADMIN.PRODUCTS}>Tạo sản phẩm</Link>} />
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
        title={undefined}
      />
    </section>
  );
}
