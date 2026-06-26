import { CheckCircle2, CircleDollarSign, Clock3, ShieldAlert } from "lucide-react";

import { AdminPaymentsTable, type AdminPaymentRow } from "@/features/ecommerce/admin/admin-payments-table";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { listAllPayments } from "@/features/ecommerce/server/service";
import { requireAdmin } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { getPaymentMethodLabel } from "@/lib/payment-methods";
import { getSystemSettings } from "@/lib/system-settings";

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const [payments, settings] = await Promise.all([listAllPayments(), getSystemSettings()]);
  const rows: AdminPaymentRow[] = payments.map((payment) => ({
    ...payment,
    amountLabel: formatCurrency(payment.amount, settings.ecommerce),
    methodLabel: getPaymentMethodLabel(payment.method, settings.ecommerce),
  }));
  const pendingCount = payments.filter((payment) => payment.status === "pending").length;
  const paidCount = payments.filter((payment) => payment.status === "paid").length;
  const issueCount = payments.filter((payment) => payment.status === "failed" || payment.status === "refunded").length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid>
        <AdminOverviewCard title="Total" value={payments.length} icon={CircleDollarSign} />
        <AdminOverviewCard title="Pending" value={pendingCount} icon={Clock3} />
        <AdminOverviewCard title="Paid" value={paidCount} icon={CheckCircle2} />
        <AdminOverviewCard title="Failed / Refunded" value={issueCount} icon={ShieldAlert} />
      </AdminOverviewGrid>

      <AdminPaymentsTable payments={rows} />
    </section>
  );
}
