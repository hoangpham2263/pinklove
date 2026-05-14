import { CheckCircle2, CircleDollarSign, PackageCheck, ShoppingCart } from "lucide-react";

import { AdminOrdersTable, type AdminOrderRow } from "@/features/ecommerce/admin/admin-orders-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Total</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{orders.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Paid</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{paidCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Need Fulfillment</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{fulfillmentCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{completedCount}</p>
          </CardContent>
        </Card>
      </div>

      <AdminOrdersTable orders={rows} />
    </section>
  );
}
