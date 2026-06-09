import { notFound, redirect } from "next/navigation";
import { AdminTableActionButton } from "@/features/admin/components/admin-table-actions";
import { requireAdmin } from "@/lib/auth";
import { getOfferingBySlug, getOfferingTypeByKey, listAllOfferingCategories, listAllOfferings } from "@/features/offerings/server/service";
import { OfferingEditorForm } from "@/features/offerings/admin/offering-editor-form";
import { SYSTEM_OFFERING_TYPES, SYSTEM_TEMPLATE_ENGINES } from "@/features/offerings/types";
import { listLandingPagesBySourceOfferingId } from "@/features/landing-pages/server/service";
import { listProviders } from "@/features/providers/server/service";
import { getOfferingPath } from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";

type AdminOfferingEditorPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminOfferingEditorPage({
  params,
  searchParams,
}: AdminOfferingEditorPageProps) {
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

  const returnTo = getQueryValue(query.returnTo) ?? ROUTES.ADMIN.OFFERING_MANAGE;

  if (offering.offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE && offering.templateEngine === SYSTEM_TEMPLATE_ENGINES.BUILDER) {
    redirect(`${ROUTES.ADMIN.OFFERING_BUILDER_EDITOR(offering.slug)}?returnTo=${encodeURIComponent(returnTo)}`);
  }

  if (offering.offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE && offering.templateEngine === SYSTEM_TEMPLATE_ENGINES.CODED) {
    redirect(`${ROUTES.ADMIN.OFFERING_TEMPLATE(offering.slug)}?returnTo=${encodeURIComponent(ROUTES.ADMIN.OFFERING_TEMPLATES)}`);
  }

  const publicHref = getOfferingPath(offering);
  const [offeringTypeDefinition, landingPages] = await Promise.all([
    getOfferingTypeByKey(offering.offeringType),
    listLandingPagesBySourceOfferingId(offering.id),
  ]);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {offering.offeringType === SYSTEM_OFFERING_TYPES.PHYSICAL_PRODUCT ? "Edit Offering" : "Edit Template"}: {offering.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <AdminTableActionButton action="external" href={publicHref} target="_blank" label="Xem nhanh" />
        </div>
      </div>
      <OfferingEditorForm
        offering={offering}
        offeringTypeDefinition={offeringTypeDefinition}
        categories={categories}
        providers={providers}
        allOfferings={allOfferings}
        landingPages={landingPages}
        returnTo={returnTo}
      />
    </section>
  );
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
