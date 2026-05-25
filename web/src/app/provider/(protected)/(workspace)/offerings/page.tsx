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
        title="Yêu cầu sản phẩm"
        description="Quản lý các yêu cầu tạo mới, cập nhật hoặc ngừng bán sản phẩm. Admin duyệt, phản hồi và nhập giá bán thực tế."
        actions={<Button render={<Link href={ROUTES.PROVIDER.OFFERING_NEW}>Tạo yêu cầu mới</Link>} />}
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

      <ProviderSectionCard title="Danh sách yêu cầu sản phẩm">
        {submissions.length === 0 ? (
          <ProviderEmptyState>Chưa có yêu cầu sản phẩm nào. Hãy tạo yêu cầu đầu tiên để gửi admin duyệt.</ProviderEmptyState>
        ) : (
          <ProviderOfferingRequestsTable submissions={submissions} />
        )}
      </ProviderSectionCard>
    </ProviderPage>
  );
}
