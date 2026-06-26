import { notFound } from "next/navigation";
import { getOfferingBySlug, getOfferingTypeByKey, listAllOfferingCategories, listAllOfferings } from "@/features/offerings/server/service";
import { OfferingEditorForm } from "@/features/offerings/admin/offering-editor-form";
import { SYSTEM_OFFERING_TYPES, SYSTEM_TEMPLATE_ENGINES } from "@/features/offerings/types";
import { listProviders } from "@/features/providers/server/service";
import { ROUTES } from "@/lib/routes";

type AdminBuilderEditorPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminBuilderEditorPage({
  params,
  searchParams,
}: AdminBuilderEditorPageProps) {
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

  if (!(offering.offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE && offering.templateEngine === SYSTEM_TEMPLATE_ENGINES.BUILDER)) {
    notFound();
  }

  const returnTo = getQueryValue(query.returnTo) ?? ROUTES.ADMIN.OFFERING_BUILDER;

  return (
    <OfferingEditorForm
      offering={offering}
      offeringTypeDefinition={await getOfferingTypeByKey(offering.offeringType)}
      categories={categories}
      providers={providers}
      allOfferings={allOfferings}
      returnTo={returnTo}
    />
  );
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
