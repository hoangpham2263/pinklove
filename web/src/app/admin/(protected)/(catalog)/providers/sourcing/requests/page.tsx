import { ClipboardList, Clock3 } from "lucide-react";

import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { listSupplierRequestsForAdmin } from "@/features/provider-offering-submissions/server/service";
import { requireAdmin } from "@/lib/auth";
import { ProviderSourcingList } from "../provider-sourcing-list";

export default async function AdminProviderSourcingRequestsPage() {
  await requireAdmin();

  const supplierRequests = await listSupplierRequestsForAdmin();
  const openRequestCount = supplierRequests.filter((request) =>
    ["submitted", "under_review", "changes_requested"].includes(request.reviewStatus)
  ).length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Provider đăng ký nhận nguồn hàng</h1>
        <p className="text-sm text-muted-foreground">Duyệt hoặc yêu cầu bổ sung thông tin cung ứng từ provider.</p>
      </div>

      <AdminOverviewGrid className="md:grid-cols-2 lg:grid-cols-2">
        <AdminOverviewCard title="Tổng yêu cầu" value={supplierRequests.length} icon={ClipboardList} />
        <AdminOverviewCard title="Đang mở" value={openRequestCount} icon={Clock3} />
      </AdminOverviewGrid>

      <ProviderSourcingList supplierRequests={supplierRequests} suppliers={[]} sourcingOfferings={[]} mode="requests" />
    </section>
  );
}
