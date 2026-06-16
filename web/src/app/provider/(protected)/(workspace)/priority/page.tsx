import { BadgePercent, Eye, MousePointerClick, ShoppingBag, Users } from "lucide-react";

import { listProviderPromotionsForUser } from "@/features/ads/server/service";
import { ProviderDataSection } from "@/features/provider-orders/components/provider-data-section";
import { ProviderOverviewCard, ProviderOverviewGrid } from "@/features/provider-orders/components/provider-overview-card";
import { ProviderPage, ProviderPageHeader } from "@/features/provider-orders/components/provider-page";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

function sumMetric(rows: Array<Record<string, unknown>>, key: string) {
  return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
}

export default async function ProviderPriorityPage() {
  const user = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const rows = await listProviderPromotionsForUser(user.id);
  const activeCount = rows.filter((row) => row.status === "active").length;

  return (
    <ProviderPage>
      <ProviderPageHeader
        title="Ưu tiên hiển thị"
        description="Theo dõi gói nổi bật, placement và hiệu quả hiển thị do admin cấp hoặc duyệt cho provider."
      />

      <ProviderOverviewGrid>
        <ProviderOverviewCard title="Gói đang chạy" value={activeCount} icon={BadgePercent} />
        <ProviderOverviewCard title="Impressions" value={sumMetric(rows, "impressions")} icon={Eye} />
        <ProviderOverviewCard title="Clicks" value={sumMetric(rows, "clicks")} icon={MousePointerClick} />
        <ProviderOverviewCard title="Leads" value={sumMetric(rows, "leads")} icon={Users} />
        <ProviderOverviewCard title="Bookings" value={sumMetric(rows, "bookings")} icon={ShoppingBag} />
      </ProviderOverviewGrid>

      <ProviderDataSection
        title="Danh sách ưu tiên"
        description="Nếu muốn bật hoặc gia hạn ưu tiên hiển thị, provider liên hệ admin để được kiểm tra placement và chất lượng nội dung."
        rows={rows}
        columns={[
          { key: "title", label: "Title" },
          { key: "plan", label: "Plan" },
          { key: "placement", label: "Placement" },
          { key: "target_type", label: "Target" },
          { key: "status", label: "Status" },
          { key: "payment_status", label: "Payment" },
          { key: "starts_at", label: "Start" },
          { key: "ends_at", label: "End" },
          { key: "impressions", label: "Views" },
          { key: "clicks", label: "Clicks" },
          { key: "leads", label: "Leads" },
          { key: "bookings", label: "Bookings" },
        ]}
        emptyMessage="Chưa có gói ưu tiên hiển thị."
      />
    </ProviderPage>
  );
}
