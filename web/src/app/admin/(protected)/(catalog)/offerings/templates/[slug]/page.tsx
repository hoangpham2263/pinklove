import { notFound, redirect } from "next/navigation";
import { listAccountsByRole, requireAdmin } from "@/lib/auth";
import { getOfferingBySlug, getOfferingTypeByKey, listAllOfferingCategories } from "@/features/offerings/server/service";
import { OfferingEditorForm } from "@/features/offerings/admin/offering-editor-form";
import { SYSTEM_OFFERING_TYPES, SYSTEM_TEMPLATE_ENGINES } from "@/features/offerings/types";
import { USER_ROLES } from "@/lib/roles";
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
  const [offering, categories, vendors] = await Promise.all([
    getOfferingBySlug(slug),
    listAllOfferingCategories(),
    listAccountsByRole(USER_ROLES.VENDOR),
  ]);

  if (!offering) {
    notFound();
  }

  const returnTo = getQueryValue(query.returnTo) ?? ROUTES.ADMIN.OFFERING_TEMPLATES;

  if (offering.offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE && offering.templateEngine === SYSTEM_TEMPLATE_ENGINES.BUILDER) {
    redirect(`${ROUTES.ADMIN.OFFERING_BUILDER_EDITOR(offering.slug)}?returnTo=${encodeURIComponent(ROUTES.ADMIN.OFFERING_BUILDER)}`);
  }

  if (offering.offeringType === SYSTEM_OFFERING_TYPES.PHYSICAL_PRODUCT) {
    redirect(`${ROUTES.ADMIN.OFFERING(offering.slug)}?returnTo=${encodeURIComponent(ROUTES.ADMIN.OFFERING_MANAGE)}`);
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Edit Offering Template: {offering.name}</h1>
        </div>
      </div>
      <OfferingEditorForm
        offering={offering}
        offeringTypeDefinition={await getOfferingTypeByKey(offering.offeringType)}
        categories={categories}
        vendors={vendors}
        returnTo={returnTo}
      />
    </section>
  );
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
