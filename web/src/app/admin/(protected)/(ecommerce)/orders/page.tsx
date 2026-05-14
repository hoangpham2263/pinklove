import { CheckCircle2, CircleDollarSign, PackageCheck, ShoppingCart } from "lucide-react";

import { AdminOrdersTable, type AdminOrderRow } from "@/features/ecommerce/admin/admin-orders-table";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { listAllOrders } from "@/features/ecommerce/server/service";
import { requireAdmin } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { getSystemSettings } from "@/lib/system-settings";

export default async function AdminOrdersPage() {
  await requireAdmin();
  const [orders, settings] = await Promise.all([listAllOrders(), getSystemSettings()]);
  const rows: AdminOrderRow[] = orders.map((order) => ({
    ...order,
    totalAmountLabel: formatCurrency(order.totalAmount, settings.ecommerce),
  }));
  const paidCount = orders.filter((order) => order.paymentStatus === "paid").length;
  const fulfillmentCount = orders.filter((order) => order.fulfillmentStatus !== "not_required").length;
  const completedCount = orders.filter((order) => order.status === "completed").length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid>
        <AdminOverviewCard title="Total" value={orders.length} icon={ShoppingCart} />
        <AdminOverviewCard title="Paid" value={paidCount} icon={CircleDollarSign} />
        <AdminOverviewCard title="Need Fulfillment" value={fulfillmentCount} icon={PackageCheck} />
        <AdminOverviewCard title="Completed" value={completedCount} icon={CheckCircle2} />
      </AdminOverviewGrid>

      <AdminOrdersTable orders={rows} />
    </section>
  );
}
