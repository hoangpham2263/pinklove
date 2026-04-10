import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { listAllProductCategories, listAllProducts } from "@/features/products/server/service";
import { QuickCreateProductForm } from "@/features/admin/components/products/quick-create-product-form";

type AdminProductsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  await requireAdmin();
  await searchParams;
  const [products, categories] = await Promise.all([listAllProducts(), listAllProductCategories()]);
  const publishedCount = products.filter((product) => product.status === "published").length;
  const draftCount = products.length - publishedCount;
  const codedCount = products.filter((product) => product.productType === "coded_template").length;
  const builderCount = products.length - codedCount;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tạo sản phẩm</h1>
          <p className="text-sm text-muted-foreground">
            Tạo sản phẩm mới, xem nhanh thống kê và truy cập danh sách sản phẩm khi cần.
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

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Tạo sản phẩm</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickCreateProductForm categories={categories} />
        </CardContent>
      </Card>
    </section>
  );
}
