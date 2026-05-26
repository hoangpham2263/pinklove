import Link from "next/link";

import { Button } from "@/components/ui/button";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { ProviderOfferingRequestsTable } from "@/features/provider-offering-submissions/components/provider-offering-requests-table";
import { listProviderOfferingSubmissionsForProvider } from "@/features/provider-offering-submissions/server/service";
import { ProviderOverviewCard, ProviderOverviewGrid } from "@/features/provider-orders/components/provider-overview-card";
import { ProviderEmptyState, ProviderPage, ProviderPageHeader, ProviderSectionCard } from "@/features/provider-orders/components/provider-page";

export default async function ProviderOfferingsPage() {
  const provider = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const submissions = await listProviderOfferingSubmissionsForProvider(provider.id);

  return (
    <ProviderPage>
      <ProviderPageHeader
        title="Yêu cầu dịch vụ/sản phẩm"
        description="Provider gửi yêu cầu nhận dịch vụ hoặc sản phẩm để admin kiểm tra, duyệt và cấp quyền lên lịch/bán."
        actions={<Button render={<Link href={`${ROUTES.PROVIDER.OFFERING_NEW}?intent=service`}>Yêu cầu nhận dịch vụ</Link>} />}
      />

      <ProviderOverviewGrid className="md:grid-cols-3 lg:grid-cols-3">
        <ProviderOverviewCard title="Tổng yêu cầu" value={submissions.length} />
        <ProviderOverviewCard
          title="Chờ duyệt"
          value={submissions.filter((item) => ["submitted", "under_review"].includes(item.reviewStatus)).length}
        />
        <ProviderOverviewCard
          title="Cần chỉnh sửa"
          value={submissions.filter((item) => item.reviewStatus === "changes_requested").length}
        />
      </ProviderOverviewGrid>

      <ProviderSectionCard title="Danh sách yêu cầu dịch vụ/sản phẩm">
        {submissions.length === 0 ? (
          <ProviderEmptyState>Chưa có yêu cầu nào. Hãy gửi yêu cầu nhận dịch vụ/sản phẩm đầu tiên để admin duyệt.</ProviderEmptyState>
        ) : (
          <ProviderOfferingRequestsTable submissions={submissions} />
        )}
      </ProviderSectionCard>
    </ProviderPage>
  );
}
