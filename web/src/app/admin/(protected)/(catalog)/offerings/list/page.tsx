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
      catalogOnly
      title="Sản phẩm & dịch vụ"
      description="Quản lý các type do provider hoặc đối tác cung ứng: thiệp giấy, video cưới, makeup, trang trí, planner và các dịch vụ mở rộng."
      returnTo={ROUTES.ADMIN.OFFERING_LIST}
    />
  );
}
