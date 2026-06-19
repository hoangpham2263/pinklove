import { Store } from "lucide-react";

import { DatabaseTable } from "@/components/common/database-table";
import { AdminCreateLinkButton } from "@/features/admin/components/admin-buttons";
import { AdminAdsPageShell } from "@/features/ads/admin/admin-ads-page-shell";
import { ProviderPlanRowActions, ProviderPromotionRowActions } from "@/features/ads/admin/ads-row-actions";
import {
  listProviderPromotionPlans,
  listProviderPromotionsForAdmin,
} from "@/features/ads/server/service";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminProviderPriorityPage() {
  await requireAdmin();
  const [promotions, plans] = await Promise.all([
    listProviderPromotionsForAdmin(),
    listProviderPromotionPlans(),
  ]);

  return (
    <AdminAdsPageShell
      title="Sponsored Providers"
      description="Ưu tiên provider/xưởng top hoặc đối tác trả phí trong danh sách hiển thị. Không dùng chung với booking dịch vụ."
      metrics={[
        { title: "Promotions", value: promotions.length, icon: Store },
        { title: "Active", value: promotions.filter((row) => row.status === "active").length },
        { title: "Plans", value: plans.length },
        { title: "Bookings", value: promotions.reduce((total, row) => total + Number(row.bookings ?? 0), 0) },
      ]}
      actions={
        <>
          <AdminCreateLinkButton href={ROUTES.ADMIN.MARKETING_PROVIDER_PRIORITY_PROMOTION_NEW}>Tạo ưu tiên provider</AdminCreateLinkButton>
          <AdminCreateLinkButton href={ROUTES.ADMIN.MARKETING_PROVIDER_PRIORITY_PLAN_NEW}>Tạo gói ưu tiên</AdminCreateLinkButton>
        </>
      }
      tableTitle="Provider Promotions"
      tableDescription="Ưu tiên provider/xưởng top đang được quản lý."
      rows={promotions}
      columns={[
        { key: "title", label: "Title" },
        { key: "provider", label: "Provider" },
        { key: "plan", label: "Plan" },
        { key: "status", label: "Status" },
        { key: "priority_weight", label: "Weight" },
        { key: "clicks", label: "Clicks" },
      ]}
      rowActions={(row) => <ProviderPromotionRowActions row={row} />}
    >
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Provider Promotion Plans</h2>
          <p className="text-sm text-muted-foreground">Gói ưu tiên dùng để tạo Sponsored Providers.</p>
        </div>
        <DatabaseTable
          rows={plans}
          columns={[
            { key: "key", label: "Key" },
            { key: "name", label: "Plan" },
            { key: "price", label: "Price" },
            { key: "priority_weight", label: "Weight" },
            { key: "is_active", label: "Active" },
          ]}
          rowActions={(row) => <ProviderPlanRowActions row={row} />}
        />
      </div>
    </AdminAdsPageShell>
  );
}
