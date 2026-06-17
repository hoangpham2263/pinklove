import { BadgePercent, Eye, MousePointerClick, ShoppingBag, Users } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { listPlacementOptions, listProviderPromotionPlanOptions, listProviderPromotionsForUser } from "@/features/ads/server/service";
import { ProviderDialogCreateTrigger, ProviderSubmitButton } from "@/features/provider-orders/components/provider-buttons";
import { ProviderDataSection } from "@/features/provider-orders/components/provider-data-section";
import { ProviderField, ProviderInput, ProviderSelect, ProviderTextarea } from "@/features/provider-orders/components/provider-form";
import { ProviderOverviewCard, ProviderOverviewGrid } from "@/features/provider-orders/components/provider-overview-card";
import { ProviderPage, ProviderPageHeader } from "@/features/provider-orders/components/provider-page";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

function sumMetric(rows: Array<Record<string, unknown>>, key: string) {
  return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
}

export default async function ProviderPriorityPage() {
  const user = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const [rows, plans, placements] = await Promise.all([
    listProviderPromotionsForUser(user.id),
    listProviderPromotionPlanOptions(),
    listPlacementOptions(),
  ]);
  const activeCount = rows.filter((row) => row.status === "active").length;

  return (
    <ProviderPage>
      <ProviderPageHeader
        title="Ưu tiên hiển thị"
        description="Theo dõi gói nổi bật, placement và hiệu quả hiển thị do admin cấp hoặc duyệt cho provider."
        actions={(
          <Dialog>
            <ProviderDialogCreateTrigger>Gửi yêu cầu</ProviderDialogCreateTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Gửi yêu cầu ưu tiên hiển thị</DialogTitle>
                <DialogDescription>Provider gửi nhu cầu, admin sẽ kiểm tra placement, giá và trạng thái publish.</DialogDescription>
              </DialogHeader>
              <NativeForm action="/api/provider/priority/requests" method="POST" className="grid gap-4 md:grid-cols-2">
                <ProviderField label="Tiêu đề" required className="md:col-span-2">
                  <ProviderInput name="title" placeholder="Ví dụ: Ưu tiên hiển thị studio tháng này" required />
                </ProviderField>
                <ProviderField label="Gói mong muốn">
                  <ProviderSelect name="planId">
                    <option value="">Admin tư vấn gói phù hợp</option>
                    {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.label}</option>)}
                  </ProviderSelect>
                </ProviderField>
                <ProviderField label="Vị trí mong muốn">
                  <ProviderSelect name="placementId">
                    <option value="">Admin chọn placement</option>
                    {placements.map((placement) => <option key={placement.id} value={placement.id}>{placement.label}</option>)}
                  </ProviderSelect>
                </ProviderField>
                <ProviderField label="Ghi chú" className="md:col-span-2">
                  <ProviderTextarea name="notes" rows={4} placeholder="Nhu cầu hiển thị, thời gian chạy, ngân sách dự kiến..." />
                </ProviderField>
                <div className="md:col-span-2">
                  <ProviderSubmitButton>Gửi yêu cầu</ProviderSubmitButton>
                </div>
              </NativeForm>
            </DialogContent>
          </Dialog>
        )}
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
