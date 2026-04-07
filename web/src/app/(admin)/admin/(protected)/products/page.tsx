import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { listAllProducts } from "@/features/products/server/service";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { QuickCreateProductForm } from "@/features/admin/components/products/quick-create-product-form";

type AdminProductsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  await requireAdmin();
  const query = (await searchParams) ?? {};
  const products = await listAllProducts();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      {query.deleted === "1" && (
        <div className="rounded-md border border-primary/20 bg-primary/10 px-4 py-3 text-sm">
          Đã xóa sản phẩm.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Tạo sản phẩm mới</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickCreateProductForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sản phẩm / Template thiệp cưới</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Đây là catalog nền tảng cho luồng bán thiệp cưới. Hiện repo đã seed sẵn coded templates và builder starter; CRUD admin đầy đủ có thể làm ở phase tiếp theo.
          </p>

          <div className="grid gap-4">
            {products.map((product) => (
              <div key={product.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      /{product.slug} • {product.productType} • {product.templateKey}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>status: {product.status}</p>
                    <p>price: {product.price}</p>
                  </div>
                </div>
                {product.excerpt && (
                  <p className="mt-3 text-sm text-muted-foreground">{product.excerpt}</p>
                )}
                <div className="mt-4">
                  <Button
                    variant="outline"
                    render={<Link href={ROUTES.ADMIN.PRODUCT(product.slug)}>Chỉnh sửa</Link>}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
    </section>
  );
}
