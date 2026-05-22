import { notFound, redirect } from "next/navigation";
import { listAccountsByRole } from "@/lib/auth";
import { getOfferingBySlug, listAllOfferingCategories } from "@/features/offerings/server/service";
import { OfferingEditorForm } from "@/features/offerings/admin/offering-editor-form";
import { USER_ROLES } from "@/lib/roles";
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
  const [offering, categories, vendors] = await Promise.all([
    getOfferingBySlug(slug),
    listAllOfferingCategories(),
    listAccountsByRole(USER_ROLES.VENDOR),
  ]);

  if (!offering) {
    notFound();
  }

  if (offering.offeringType !== "builder") {
    const fallbackHref =
      offering.offeringType === "coded_template"
        ? ROUTES.ADMIN.OFFERING_TEMPLATE(offering.slug)
        : ROUTES.ADMIN.OFFERING(offering.slug);
    redirect(`${fallbackHref}${query.returnTo ? `?returnTo=${encodeURIComponent(getQueryValue(query.returnTo) ?? "")}` : ""}`);
  }

  const returnTo = getQueryValue(query.returnTo) ?? ROUTES.ADMIN.OFFERING_BUILDER;

  return <OfferingEditorForm offering={offering} categories={categories} vendors={vendors} returnTo={returnTo} />;
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
