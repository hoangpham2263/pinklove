import { CheckCircle2, Clock3, PackageCheck, Truck } from "lucide-react";

import { AdminShipmentsTable } from "@/features/ecommerce/admin/admin-shipments-table";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
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
      <AdminOverviewGrid>
        <AdminOverviewCard title="Total" value={shipments.length} icon={Truck} />
        <AdminOverviewCard title="Pending / Packing" value={pendingCount} icon={Clock3} />
        <AdminOverviewCard title="Shipped" value={shippedCount} icon={PackageCheck} />
        <AdminOverviewCard title="Delivered" value={deliveredCount} icon={CheckCircle2} />
      </AdminOverviewGrid>

      <AdminShipmentsTable shipments={shipments} />
    </section>
  );
}
