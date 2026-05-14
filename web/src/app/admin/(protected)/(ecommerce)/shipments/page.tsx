import { CheckCircle2, Clock3, PackageCheck, Truck } from "lucide-react";

import { AdminShipmentsTable } from "@/features/ecommerce/admin/admin-shipments-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAllShipments } from "@/features/ecommerce/server/service";
import { requireAdmin } from "@/lib/auth";

export default async function AdminShipmentsPage() {
  await requireAdmin();
  const shipments = await listAllShipments();
  const pendingCount = shipments.filter((shipment) => shipment.status === "pending" || shipment.status === "packing").length;
  const shippedCount = shipments.filter((shipment) => shipment.status === "shipped").length;
  const deliveredCount = shipments.filter((shipment) => shipment.status === "delivered").length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Total</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{shipments.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Pending / Packing</CardTitle>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Shipped</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{shippedCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Delivered</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{deliveredCount}</p>
          </CardContent>
        </Card>
      </div>

      <AdminShipmentsTable shipments={shipments} />
    </section>
  );
}
