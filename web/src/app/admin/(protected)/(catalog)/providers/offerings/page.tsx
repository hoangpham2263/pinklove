import { CheckCircle2, ClipboardList, Clock3, Truck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { AdminProviderOfferingRequestsTable } from "@/features/provider-offering-submissions/components/admin-provider-offering-requests-table";
import {
  listOfferingProviderSuppliersForAdmin,
  listProviderOfferingSubmissionsForAdmin,
} from "@/features/provider-offering-submissions/server/service";
import { requireAdmin } from "@/lib/auth";

export default async function AdminProviderOfferingRequestsPage() {
  await requireAdmin();

  const [submissions, suppliers] = await Promise.all([
    listProviderOfferingSubmissionsForAdmin(),
    listOfferingProviderSuppliersForAdmin(),
  ]);
  const uniqueProviders = Array.from(
    new Map(submissions.map((item) => [item.providerId, { id: item.providerId, name: item.providerDisplayName }])).values()
  ).sort((left, right) => left.name.localeCompare(right.name, "vi"));
  const submittedCount = submissions.filter((item) => item.reviewStatus === "submitted").length;
  const underReviewCount = submissions.filter((item) => item.reviewStatus === "under_review").length;
  const approvedCount = submissions.filter((item) => item.reviewStatus === "approved").length;
  const pendingCount = submittedCount + underReviewCount;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Provider Submissions</h1>
        <p className="text-sm text-muted-foreground">
          Duyệt hồ sơ sản phẩm provider gửi lên. Nghiệp vụ nguồn hàng/supplier nằm ở trang Sourcing riêng.
        </p>
      </div>

      <AdminOverviewGrid>
        <AdminOverviewCard title="Tổng hồ sơ" value={submissions.length} icon={ClipboardList} />
        <AdminOverviewCard title="Chờ duyệt" value={submittedCount} icon={Clock3} />
        <AdminOverviewCard title="Cần xử lý" value={pendingCount} icon={Truck} />
        <AdminOverviewCard title="Đã duyệt / Supplier" value={`${approvedCount} / ${suppliers.length}`} icon={CheckCircle2} />
      </AdminOverviewGrid>

      <Card className="min-w-0 overflow-visible rounded-lg gap-0">
        <CardHeader className="border-b gap-0 pb-0">
          <CardTitle>Danh sách submissions</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <AdminProviderOfferingRequestsTable submissions={submissions} providers={uniqueProviders} />
        </CardContent>
      </Card>
    </section>
  );
}
