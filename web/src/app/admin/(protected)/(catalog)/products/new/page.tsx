import { Package } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { listAccountsByRole, requireAdmin } from "@/lib/auth";
import { listAllProductCategories } from "@/features/products/server/service";
import { QuickCreateProductForm } from "@/features/products/admin/quick-create-product-form";
import { USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

type AdminProductCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminProductCreatePage({ searchParams }: AdminProductCreatePageProps) {
  await requireAdmin();
  const query = (await searchParams) ?? {};
  const requestedType = getQueryValue(query.type);
  const returnTo = getQueryValue(query.returnTo) ?? (
    requestedType === "builder_template" ? ROUTES.ADMIN.BUILDER : ROUTES.ADMIN.PRODUCT_LIST
  );

  if (requestedType === "builder_template") {
    redirect(`${ROUTES.ADMIN.BUILDER_CREATE}?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const [categories, vendors] = await Promise.all([
    listAllProductCategories(),
    listAccountsByRole(USER_ROLES.VENDOR),
  ]);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tạo sản phẩm</h1>
          <p className="text-sm text-muted-foreground">
            Nhóm sản phẩm bán ra không dùng template invitation source. Builder được tạo ở trình builder chuyên biệt.
          </p>
        </div>
      </div>
      <AdminOverviewGrid className="md:grid-cols-1 lg:grid-cols-1">
        <AdminOverviewCard title="Sản phẩm" icon={Package}>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Nhóm này không dùng template invitation source.</p>
            <p>Đối tác khả dụng: {vendors.length}</p>
          </div>
        </AdminOverviewCard>
      </AdminOverviewGrid>
      <QuickCreateProductForm
        categories={categories}
        vendors={vendors}
        returnTo={returnTo}
      />
    </section>
  );
}
