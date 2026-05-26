import { CalendarClock, ClipboardList, Store, Truck, UserRoundPlus, UsersRound } from "lucide-react";

import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { listProviderOfferingSubmissionsForAdmin } from "@/features/provider-offering-submissions/server/service";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/database";
import { ROUTES } from "@/lib/routes";

export default async function AdminProvidersPage() {
  await requireAdmin();

  const [providerSummary, slotSummary, submissions] = await Promise.all([
    query<{
      total_providers: string;
      active_providers: string;
      provider_accounts: string;
    }>(`
      SELECT
        (SELECT COUNT(*)::text FROM providers) AS total_providers,
        (SELECT COUNT(*)::text FROM providers WHERE status = 'active') AS active_providers,
        (SELECT COUNT(*)::text FROM users WHERE role = 'provider') AS provider_accounts
    `),
    query<{
      total_slots: string;
      open_slots: string;
    }>(`
      SELECT
        COUNT(*)::text AS total_slots,
        COUNT(*) FILTER (WHERE status = 'open')::text AS open_slots
      FROM provider_time_slots
    `),
    listProviderOfferingSubmissionsForAdmin(),
  ]);

  const providers = providerSummary.rows[0];
  const slots = slotSummary.rows[0];
  const submittedCount = submissions.filter((item) => item.reviewStatus === "submitted").length;
  const underReviewCount = submissions.filter((item) => item.reviewStatus === "under_review").length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Providers</h1>
        <p className="text-sm text-muted-foreground">
          Tổng quan nhà cung cấp, lịch khả dụng, submission dịch vụ/sản phẩm và vận hành cung ứng.
        </p>
      </div>

      <AdminOverviewGrid>
        <AdminOverviewCard title="Provider profiles" value={providers?.total_providers ?? 0} description={`${providers?.active_providers ?? 0} đang hoạt động`} icon={Store} />
        <AdminOverviewCard title="Provider accounts" value={providers?.provider_accounts ?? 0} description="Tài khoản đăng nhập portal" icon={UsersRound} />
        <AdminOverviewCard title="Availability slots" value={slots?.total_slots ?? 0} description={`${slots?.open_slots ?? 0} slot đang mở`} icon={CalendarClock} />
        <AdminOverviewCard title="Submissions cần duyệt" value={submittedCount + underReviewCount} description={`${submittedCount} mới, ${underReviewCount} đang duyệt`} icon={ClipboardList} />
      </AdminOverviewGrid>

      <AdminOverviewGrid className="md:grid-cols-2 xl:grid-cols-3">
        <AdminOverviewCard
          title="Tài khoản provider"
          description="Tạo, sửa, kiểm soát supplier status và thông tin portal đối tác."
          href={ROUTES.ADMIN.PROVIDER_ACCOUNTS}
          hrefLabel="Quản lý tài khoản"
          icon={UsersRound}
        />
        <AdminOverviewCard
          title="Tạo provider"
          description="Tạo nhanh tài khoản provider mới và hồ sơ liên quan."
          href={ROUTES.ADMIN.PROVIDER_ACCOUNTS_CREATE}
          hrefLabel="Tạo provider"
          icon={UserRoundPlus}
        />
        <AdminOverviewCard
          title="Availability"
          description="Admin chỉ xem/kiểm tra lịch; provider tự nhập lịch trong portal."
          href={ROUTES.ADMIN.PROVIDER_AVAILABILITY}
          hrefLabel="Xem lịch khả dụng"
          icon={CalendarClock}
        />
        <AdminOverviewCard
          title="Service/product submissions"
          description="Duyệt hồ sơ dịch vụ/sản phẩm provider gửi lên trước khi áp dụng vào catalog."
          href={ROUTES.ADMIN.PROVIDER_OFFERINGS}
          hrefLabel="Duyệt submissions"
          icon={ClipboardList}
        />
        <AdminOverviewCard
          title="Sourcing & suppliers"
          description="Mở offering cho provider đăng ký cung ứng và quản lý vòng đời supplier."
          href={ROUTES.ADMIN.PROVIDER_SOURCING_OFFERINGS}
          hrefLabel="Vận hành cung ứng"
          icon={Truck}
        />
      </AdminOverviewGrid>
    </section>
  );
}
