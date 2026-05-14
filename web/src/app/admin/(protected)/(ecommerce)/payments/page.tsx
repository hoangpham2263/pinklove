import { CheckCircle2, CircleDollarSign, Clock3, ShieldAlert } from "lucide-react";

import { AdminPaymentsTable, type AdminPaymentRow } from "@/features/ecommerce/admin/admin-payments-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Total</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{payments.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Pending</CardTitle>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Paid</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{paidCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Failed / Refunded</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{issueCount}</p>
          </CardContent>
        </Card>
      </div>

      <AdminPaymentsTable payments={rows} />
    </section>
  );
}
