import { listAllOfferings } from "@/features/offerings/server/service";
import { LandingPageCreateForm } from "@/features/landing-pages/admin/landing-page-create-form";
import { requireAdmin } from "@/lib/auth";

type AdminProductLandingPageCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminProductLandingPageCreatePage({
  searchParams,
}: AdminProductLandingPageCreatePageProps) {
  await requireAdmin();
  const query = (await searchParams) ?? {};
  const offerings = await listAllOfferings();
  const selectedSourceOfferingId = getQueryValue(query.sourceOffering);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <h1 className="text-2xl font-bold tracking-tight">Tạo landing</h1>

      <LandingPageCreateForm
        offerings={offerings}
        selectedSourceOfferingId={selectedSourceOfferingId}
      />
    </section>
  );
}
