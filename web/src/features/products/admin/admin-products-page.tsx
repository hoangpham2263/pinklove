import { CheckCircle2, FileText, Package } from "lucide-react";
import { AdminCreateLinkButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
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
      ? `${ROUTES.ADMIN.BUILDER_CREATE}?returnTo=${encodeURIComponent(returnTo)}`
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
            <AdminCreateLinkButton href={createHref}>
              {fixedProductType === "builder_template" ? "Tạo builder" : "Tạo sản phẩm"}
            </AdminCreateLinkButton>
          ) : null}
        </div>
      ) : null}

      <AdminOverviewGrid className="md:grid-cols-3 lg:grid-cols-3">
        <AdminOverviewCard title="Tổng sản phẩm" value={filteredProducts.length} icon={Package} />
        <AdminOverviewCard title="Published" value={publishedCount} icon={CheckCircle2} />
        <AdminOverviewCard title="Draft" value={draftCount} icon={FileText} />
      </AdminOverviewGrid>

      <AdminProductList
        products={filteredProducts}
        search={search}
        status={status}
        productType={fixedProductType}
        title={undefined}
        returnTo={returnTo}
      />
    </section>
  );
}
