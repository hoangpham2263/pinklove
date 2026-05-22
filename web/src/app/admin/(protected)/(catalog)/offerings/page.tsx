import { requireAdmin } from "@/lib/auth";
import { AdminOfferingsPageView } from "@/features/offerings/admin/admin-offerings-page";
import { ROUTES } from "@/lib/routes";

type AdminOfferingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminOfferingsPage({ searchParams }: AdminOfferingsPageProps) {
  await requireAdmin();
  const query = (await searchParams) ?? {};

  return (
    <AdminOfferingsPageView
      query={query}
      fixedOfferingType="general_offering"
      title="Quản lý sản phẩm"
      description=""
      returnTo={ROUTES.ADMIN.OFFERING_LIST}
    />
  );
}
