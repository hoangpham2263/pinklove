import { notFound } from "next/navigation";
import { AdminTableActionButton } from "@/features/admin/components/admin-table-actions";
import { requireAdmin } from "@/lib/auth";
import { getOfferingBySlug, getOfferingTypeByKey, listAllOfferingCategories, listAllOfferings } from "@/features/offerings/server/service";
import { OfferingEditorForm } from "@/features/offerings/admin/offering-editor-form";
import { SYSTEM_OFFERING_TYPES, SYSTEM_TEMPLATE_ENGINES } from "@/features/offerings/types";
import { listProviders } from "@/features/providers/server/service";
import { getOfferingPath } from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";

type AdminOfferingTemplateEditorPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminOfferingTemplateEditorPage({
  params,
  searchParams,
}: AdminOfferingTemplateEditorPageProps) {
  await requireAdmin();
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const [offering, categories, providers, allOfferings] = await Promise.all([
    getOfferingBySlug(slug),
    listAllOfferingCategories(),
    listProviders(),
    listAllOfferings(),
  ]);

  if (!offering) {
    notFound();
  }

  const returnTo = getQueryValue(query.returnTo) ?? ROUTES.ADMIN.OFFERING_TEMPLATES;

  if (offering.offeringType !== SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE || offering.templateEngine !== SYSTEM_TEMPLATE_ENGINES.CODED) {
    notFound();
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Edit Coded Template: {offering.name}</h1>
        </div>
        <AdminTableActionButton action="external" href={getOfferingPath(offering)} target="_blank" label="Xem nhanh" />
      </div>
      <OfferingEditorForm
        offering={offering}
        offeringTypeDefinition={await getOfferingTypeByKey(offering.offeringType)}
        categories={categories}
        providers={providers}
        allOfferings={allOfferings}
        returnTo={returnTo}
      />
    </section>
  );
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
