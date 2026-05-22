import { AdminOfferingsPageView } from "@/features/offerings/admin/admin-offerings-page";
import { requireAdmin } from "@/lib/auth";
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
      title="Offerings"
      description="Quản lý toàn bộ offerings bằng table."
      returnTo={ROUTES.ADMIN.OFFERING_LIST}
    />
  );
}
