import { CheckCircle2, CircleDollarSign, Clock3, ShieldAlert } from "lucide-react";

import { listAffiliateConversions } from "@/features/affiliate/server/service";
import { AdminAffiliateConversionsTable } from "@/features/admin/components/affiliates/admin-affiliate-conversions-table";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { requireAdmin } from "@/lib/auth";

export default async function AdminAffiliateConversionsPage() {
  await requireAdmin();
  const conversions = await listAffiliateConversions();
  const pendingCount = conversions.filter((conversion) => conversion.status === "pending").length;
  const approvedCount = conversions.filter((conversion) => conversion.status === "approved").length;
  const paidCount = conversions.filter((conversion) => conversion.status === "paid").length;
  const rejectedCount = conversions.filter((conversion) => conversion.status === "rejected").length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="rounded-md border bg-background p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Hoa hồng Affiliate</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Conversion được tạo khi đơn hàng ghi nhận mã affiliate. Admin duyệt approved, đánh dấu paid sau khi thanh toán hoa hồng, hoặc rejected nếu đơn bị hủy/hoàn.
        </p>
      </div>

      <AdminOverviewGrid>
        <AdminOverviewCard title="Pending" value={pendingCount} icon={Clock3} />
        <AdminOverviewCard title="Approved" value={approvedCount} icon={CheckCircle2} />
        <AdminOverviewCard title="Paid" value={paidCount} icon={CircleDollarSign} />
        <AdminOverviewCard title="Rejected" value={rejectedCount} icon={ShieldAlert} />
      </AdminOverviewGrid>

      <AdminAffiliateConversionsTable conversions={conversions} />
    </section>
  );
}
