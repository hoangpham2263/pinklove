import { requireAdmin } from "@/lib/auth";
import { AdminOfferingsPageView } from "@/features/offerings/admin/admin-offerings-page";
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
      fixedOfferingType="digital_template"
      fixedTemplateEngine="builder"
      title="Offering Builder"
      description=""
      returnTo={ROUTES.ADMIN.OFFERING_BUILDER}
    />
  );
}
