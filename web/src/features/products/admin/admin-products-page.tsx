import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CheckCircle2, FileText, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listAllProducts } from "@/features/products/server/service";
import type { Product, ProductType } from "@/features/products/types";
import { AdminProductList } from "@/features/products/admin/admin-product-list";
import { ROUTES } from "@/lib/routes";

type AdminProductsPageViewProps = {
  query: Record<string, string | string[] | undefined>;
  fixedProductType: ProductType;
  title: string;
  description: string;
  returnTo: string;
};

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function AdminProductsPageView({
  query,
  fixedProductType,
  title,
  description,
  returnTo,
}: AdminProductsPageViewProps) {
  const products = await listAllProducts();
  const search = getQueryValue(query.q) ?? "";
  const status = (getQueryValue(query.status) ?? "") as "" | Product["status"];
  const filteredProducts = products.filter((product) => product.productType === fixedProductType);
  const publishedCount = filteredProducts.filter((product) => product.status === "published").length;
  const draftCount = filteredProducts.length - publishedCount;
  const canCreateProduct = fixedProductType === "general_product" || fixedProductType === "builder_template";
  const createHref =
    fixedProductType === "builder_template"
      ? `${ROUTES.ADMIN.BUILDER_TEMPLATE_CREATE}?returnTo=${encodeURIComponent(returnTo)}`
      : `${ROUTES.ADMIN.PRODUCTS}?type=${fixedProductType}&returnTo=${encodeURIComponent(returnTo)}`;
  const hasHeaderContent = title.trim().length > 0 || description.trim().length > 0 || canCreateProduct;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      {hasHeaderContent ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          {title.trim().length > 0 || description.trim().length > 0 ? (
            <div>
              {title.trim().length > 0 ? <h1 className="text-2xl font-bold tracking-tight">{title}</h1> : null}
              {description.trim().length > 0 ? <p className="text-sm text-muted-foreground">{description}</p> : null}
            </div>
          ) : null}
          {canCreateProduct ? (
            <Button
              render={
                <Link href={createHref}>
                  {fixedProductType === "builder_template" ? "Tạo mẫu builder" : "Tạo sản phẩm"}
                </Link>
              }
            />
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Tổng sản phẩm</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{filteredProducts.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{publishedCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{draftCount}</p>
          </CardContent>
        </Card>
      </div>

      <AdminProductList
        products={filteredProducts}
        search={search}
        status={status}
        productType={fixedProductType}
        title={undefined}
        returnTo={returnTo}
        lockProductType
      />
    </section>
  );
}
