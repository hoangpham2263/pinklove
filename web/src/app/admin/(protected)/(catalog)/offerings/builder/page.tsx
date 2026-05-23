import { requireAdmin } from "@/lib/auth";
import { AdminOfferingsPageView } from "@/features/offerings/admin/admin-offerings-page";
import { SYSTEM_OFFERING_TYPES, SYSTEM_TEMPLATE_ENGINES } from "@/features/offerings/types";
import { ROUTES } from "@/lib/routes";

type AdminBuilderOfferingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminBuilderOfferingsPage({ searchParams }: AdminBuilderOfferingsPageProps) {
  await requireAdmin();
  const query = (await searchParams) ?? {};

  return (
    <AdminOfferingsPageView
      query={query}
      fixedOfferingType={SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE}
      fixedTemplateEngine={SYSTEM_TEMPLATE_ENGINES.BUILDER}
      title="Offering Builder"
      description=""
      returnTo={ROUTES.ADMIN.OFFERING_BUILDER}
    />
  );
}
