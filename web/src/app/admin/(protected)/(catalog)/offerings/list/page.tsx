import { requireAdmin } from "@/lib/auth";
import { AdminOfferingsPageView } from "@/features/offerings/admin/admin-offerings-page";
import { ROUTES } from "@/lib/routes";

type AdminOfferingsManagePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminOfferingsManagePage({ searchParams }: AdminOfferingsManagePageProps) {
  await requireAdmin();
  const query = (await searchParams) ?? {};

  return (
    <AdminOfferingsPageView
      query={query}
      fixedOfferingType="physical_product"
      title="Quản lý sản phẩm"
      description=""
      returnTo={ROUTES.ADMIN.OFFERING_MANAGE}
    />
  );
}
