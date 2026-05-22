import { requireAdmin } from "@/lib/auth";
import { AdminOfferingsPageView } from "@/features/offerings/admin/admin-offerings-page";
import { ROUTES } from "@/lib/routes";

type AdminCodedOfferingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminCodedOfferingsPage({ searchParams }: AdminCodedOfferingsPageProps) {
  await requireAdmin();
  const query = (await searchParams) ?? {};

  return (
    <AdminOfferingsPageView
      query={query}
      fixedOfferingType="coded_template"
      title=""
      description=""
      returnTo={ROUTES.ADMIN.OFFERING_TEMPLATES}
    />
  );
}
