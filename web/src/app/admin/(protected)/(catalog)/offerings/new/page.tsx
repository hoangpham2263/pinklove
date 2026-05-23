import { Package } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { listAccountsByRole, requireAdmin } from "@/lib/auth";
import { listAllOfferingCategories, listOfferingTypes } from "@/features/offerings/server/service";
import { QuickCreateOfferingForm } from "@/features/offerings/admin/quick-create-offering-form";
import { SYSTEM_OFFERING_TYPES, SYSTEM_TEMPLATE_ENGINES } from "@/features/offerings/types";
import { USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

type AdminOfferingCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminOfferingCreatePage({ searchParams }: AdminOfferingCreatePageProps) {
  await requireAdmin();
  const query = (await searchParams) ?? {};
  const requestedType = getQueryValue(query.type);
  const returnTo = getQueryValue(query.returnTo) ?? (
    requestedType === SYSTEM_TEMPLATE_ENGINES.BUILDER ? ROUTES.ADMIN.OFFERING_BUILDER : ROUTES.ADMIN.OFFERING_MANAGE
  );

  if (requestedType === SYSTEM_TEMPLATE_ENGINES.BUILDER) {
    redirect(`${ROUTES.ADMIN.OFFERING_BUILDER_CREATE}?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const [categories, vendors, offeringTypes] = await Promise.all([
    listAllOfferingCategories(),
    listAccountsByRole(USER_ROLES.VENDOR),
    listOfferingTypes(),
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
      <QuickCreateOfferingForm
        categories={categories}
        vendors={vendors}
        offeringTypes={offeringTypes}
        initialOfferingType={requestedType && requestedType !== SYSTEM_TEMPLATE_ENGINES.BUILDER ? requestedType : SYSTEM_OFFERING_TYPES.PHYSICAL_PRODUCT}
        returnTo={returnTo}
      />
    </section>
  );
}
