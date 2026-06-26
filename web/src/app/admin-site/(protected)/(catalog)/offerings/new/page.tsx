import { Package } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { requireAdmin } from "@/lib/auth";
import { listAllOfferingCategories, listOfferingTypes } from "@/features/offerings/server/service";
import { QuickCreateOfferingForm } from "@/features/offerings/admin/quick-create-offering-form";
import { SYSTEM_OFFERING_TYPES, SYSTEM_TEMPLATE_ENGINES } from "@/features/offerings/types";
import { listProviders } from "@/features/providers/server/service";
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
    requestedType === SYSTEM_TEMPLATE_ENGINES.BUILDER ? ROUTES.ADMIN.OFFERING_BUILDER : ROUTES.ADMIN.OFFERING_LIST
  );

  if (requestedType === SYSTEM_TEMPLATE_ENGINES.BUILDER) {
    notFound();
  }

  const [categories, providers, offeringTypes] = await Promise.all([
    listAllOfferingCategories(),
    listProviders(),
    listOfferingTypes(),
  ]);
  const catalogOfferingTypes = offeringTypes.filter((type) => type.key !== SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE);
  const initialOfferingType =
    requestedType && requestedType !== SYSTEM_TEMPLATE_ENGINES.BUILDER && catalogOfferingTypes.some((type) => type.key === requestedType)
      ? requestedType
      : catalogOfferingTypes[0]?.key ?? SYSTEM_OFFERING_TYPES.PHYSICAL_PRODUCT;

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
            <p>Provider khả dụng: {providers.length}</p>
          </div>
        </AdminOverviewCard>
      </AdminOverviewGrid>
      <QuickCreateOfferingForm
        categories={categories}
        providers={providers}
        offeringTypes={catalogOfferingTypes}
        initialOfferingType={initialOfferingType}
        returnTo={returnTo}
      />
    </section>
  );
}
