import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listAllProducts } from "@/features/products/server/service";
import type { Product, ProductType } from "@/features/products/types";
import { AdminProductList } from "@/features/products/admin/admin-product-list";
import { sanitizePermalinkConfig } from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

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
  const [products, settings] = await Promise.all([listAllProducts(), getSystemSettings()]);
  const permalinkConfig = sanitizePermalinkConfig(settings.permalink);
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

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tổng sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{filteredProducts.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{publishedCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{draftCount}</p>
          </CardContent>
        </Card>
      </div>

      <AdminProductList
        products={filteredProducts}
        search={search}
        status={status}
        productType={fixedProductType}
        title={undefined}
        permalinkConfig={permalinkConfig}
        returnTo={returnTo}
        lockProductType
      />
    </section>
  );
}
