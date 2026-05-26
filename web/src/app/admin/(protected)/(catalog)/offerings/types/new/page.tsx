import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { OfferingTypeForm } from "../offering-type-form";

type AdminOfferingTypeCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminOfferingTypeCreatePage({
  searchParams,
}: AdminOfferingTypeCreatePageProps) {
  await requireAdmin();
  const query = (await searchParams) ?? {};
  const returnTo = getQueryValue(query.returnTo) ?? ROUTES.ADMIN.OFFERING_TYPES;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Tạo offering type</h1>
        <p className="text-sm text-muted-foreground">
          Khai báo type, fulfillment và field definitions cho form offering.
        </p>
      </div>
      <OfferingTypeForm returnTo={returnTo} />
    </section>
  );
}
