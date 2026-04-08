import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import type { Product, ProductType } from "@/features/products/types";

export function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function filterProducts(
  products: Product[],
  search: string,
  status: "" | Product["status"],
  productType: "" | ProductType
) {
  const keyword = search.trim().toLowerCase();

  return products.filter((product) => {
    const matchesSearch =
      !keyword ||
      product.name.toLowerCase().includes(keyword) ||
      product.slug.toLowerCase().includes(keyword) ||
      product.templateKey.toLowerCase().includes(keyword);
    const matchesStatus = !status || product.status === status;
    const matchesType = !productType || product.productType === productType;

    return matchesSearch && matchesStatus && matchesType;
  });
}

type AdminProductListProps = {
  products: Product[];
  search: string;
  status: "" | Product["status"];
  productType: "" | ProductType;
  actionPath: string;
  title?: string;
};

export function AdminProductList({
  products,
  search,
  status,
  productType,
  actionPath,
  title = "All Products",
}: AdminProductListProps) {
  const filteredProducts = filterProducts(products, search, status, productType);

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={actionPath} className="grid gap-3 md:grid-cols-[1.6fr_1fr_1fr_auto]">
          <input
            name="q"
            defaultValue={search}
            placeholder="Tìm theo tên, slug, template key"
            className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <select
            name="status"
            defaultValue={status}
            className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <select
            name="type"
            defaultValue={productType}
            className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Tất cả loại</option>
            <option value="coded_template">Coded Template</option>
            <option value="builder_template">Builder Template</option>
          </select>
          <Button type="submit" className="rounded-md">Lọc</Button>
        </form>

        <div className="grid gap-4">
          {filteredProducts.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Không có sản phẩm phù hợp với bộ lọc hiện tại.
            </div>
          )}
          {filteredProducts.map((product) => (
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
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="rounded-md"
                  render={<Link href={ROUTES.ADMIN.PRODUCT(product.slug)}>Chỉnh sửa</Link>}
                />
                <Button
                  variant="secondary"
                  className="rounded-md"
                  render={
                    <Link
                      href={
                        product.productType === "builder_template"
                          ? `/builder/${product.slug}`
                          : `/templates/${product.slug}`
                      }
                    >
                      Xem ngoài site
                    </Link>
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
