import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ProviderOverviewCard, ProviderOverviewGrid } from "@/features/provider-orders/components/provider-overview-card";
import { ProviderEmptyState, ProviderPage, ProviderPageHeader, ProviderSectionCard } from "@/features/provider-orders/components/provider-page";
import { ProviderAvailabilityCalendar } from "@/features/providers/components/provider-availability-calendar";
import { ProviderAvailabilityManager, ProviderAvailabilityRulesList } from "@/features/providers/components/provider-availability-manager";
import { listProviderAvailabilityRules, listProviderSchedulableServices } from "@/features/providers/server/availability";
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
  const services = provider ? await listProviderSchedulableServices(provider.id) : [];
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
        <ProviderOverviewCard title="Dịch vụ có thể lên lịch" value={services.length} />
        <ProviderOverviewCard title="Loại provider" value={provider ? getProviderTypeLabel(provider.provider_type) : "-"} />
      </ProviderOverviewGrid>

      {!provider ? (
        <ProviderEmptyState>Chưa có hồ sơ provider để cấu hình lịch.</ProviderEmptyState>
      ) : (
        <div className="space-y-5">
          {services.length === 0 ? (
            <ProviderSectionCard
              title="Cần yêu cầu nhận dịch vụ"
              description="Provider cần có dịch vụ được admin duyệt/gán trước khi khai báo lịch. Sau khi có dịch vụ, lịch sẽ được tạo theo từng dịch vụ cụ thể."
              actions={<Button render={<Link href={`${ROUTES.PROVIDER.OFFERING_NEW}?intent=service`}>Yêu cầu nhận dịch vụ</Link>} />}
            >
              <ProviderEmptyState>
                Chưa có dịch vụ nào có thể lên lịch. Hãy gửi yêu cầu nhận dịch vụ để admin kiểm tra, duyệt và cấp dịch vụ cho provider.
              </ProviderEmptyState>
            </ProviderSectionCard>
          ) : (
            <ProviderSectionCard
              title="Calendar kéo thả"
              description="Chọn dịch vụ và mục đích rồi quét vùng giờ để tạo lịch. Mỗi khung lịch phải gắn với một dịch vụ đã được duyệt/gán."
              actions={<ProviderAvailabilityManager services={services} />}
              contentClassName="pt-4"
            >
              <ProviderAvailabilityCalendar rules={rules} services={services} />
            </ProviderSectionCard>
          )}

          <ProviderAvailabilityRulesList rules={rules} services={services} />
        </div>
      )}
    </ProviderPage>
  );
}
