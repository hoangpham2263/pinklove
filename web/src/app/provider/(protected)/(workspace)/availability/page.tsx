import { ProviderOverviewCard, ProviderOverviewGrid } from "@/features/provider-orders/components/provider-overview-card";
import { ProviderEmptyState, ProviderPage, ProviderPageHeader, ProviderSectionCard } from "@/features/provider-orders/components/provider-page";
import { ProviderAvailabilityCalendar } from "@/features/providers/components/provider-availability-calendar";
import { ProviderAvailabilityManager, ProviderAvailabilityRulesList } from "@/features/providers/components/provider-availability-manager";
import { listProviderAvailabilityRules } from "@/features/providers/server/availability";
import { getProviderByUserId } from "@/features/providers/server/service";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

function getProviderTypeLabel(value: string) {
  switch (value) {
    case "makeup":
      return "Makeup";
    case "photographer":
      return "Photographer";
    case "planner":
      return "Planner";
    case "studio":
      return "Studio";
    case "florist":
      return "Florist";
    case "videographer":
      return "Videographer";
    case "creator":
      return "Creator";
    case "supplier":
    default:
      return "Supplier";
  }
}

export default async function ProviderAvailabilityPage() {
  const providerUser = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const provider = await getProviderByUserId(providerUser.id);
  const rules = provider ? await listProviderAvailabilityRules(provider.id) : [];
  const activeRules = rules.filter((rule) => rule.status === "available").length;

  return (
    <ProviderPage>
      <ProviderPageHeader
        eyebrow={provider ? getProviderTypeLabel(provider.provider_type) : "Provider"}
        title="Lịch khả dụng"
        description="Provider tự khai báo khung giờ nhận lịch. Website sẽ dùng dữ liệu này để biết provider nào còn trống theo từng loại dịch vụ."
      />

      <ProviderOverviewGrid>
        <ProviderOverviewCard title="Khung lịch" value={rules.length} />
        <ProviderOverviewCard title="Đang nhận" value={activeRules} />
        <ProviderOverviewCard title="Loại provider" value={provider ? getProviderTypeLabel(provider.provider_type) : "-"} />
        <ProviderOverviewCard title="Quản lý" value="Tự động" description="Admin chỉ xem khi cần kiểm tra" />
      </ProviderOverviewGrid>

      {!provider ? (
        <ProviderEmptyState>Chưa có hồ sơ provider để cấu hình lịch.</ProviderEmptyState>
      ) : (
        <div className="space-y-5">
          <ProviderSectionCard
            title="Calendar kéo thả"
            description="Quét vùng giờ để tạo nhanh. Kéo để đổi ngày/giờ, kéo mép trên/dưới để đổi thời lượng, click vào event để xóa."
            actions={<ProviderAvailabilityManager />}
            contentClassName="pt-4"
          >
            <ProviderAvailabilityCalendar rules={rules} />
          </ProviderSectionCard>

          <ProviderAvailabilityRulesList rules={rules} />
        </div>
      )}
    </ProviderPage>
  );
}
