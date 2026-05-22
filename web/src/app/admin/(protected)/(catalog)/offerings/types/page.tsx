import { AdminOverviewCard } from "@/features/admin/components/admin-overview-card";
import { listOfferingTypes } from "@/features/offerings/server/service";
import { requireAdmin } from "@/lib/auth";
import { Boxes, Database, Layers3, Settings2 } from "lucide-react";
import { AdminOfferingTypesTable } from "./admin-offering-types-table";

export default async function AdminOfferingTypesPage() {
  await requireAdmin();
  const offeringTypes = await listOfferingTypes({ includeArchived: true });
  const activeCount = offeringTypes.filter((type) => type.status === "active").length;
  const customCount = offeringTypes.filter((type) => !type.isSystem).length;
  const fieldCount = offeringTypes.reduce((sum, type) => sum + type.fieldSchema.length, 0);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Offering Types</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý type, fulfillment và dynamic fields bằng table.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminOverviewCard title="Tổng type" value={offeringTypes.length} icon={Boxes} />
        <AdminOverviewCard title="Active" value={activeCount} icon={Settings2} />
        <AdminOverviewCard title="Custom" value={customCount} icon={Layers3} />
        <AdminOverviewCard title="Fields" value={fieldCount} icon={Database} />
      </div>

      <AdminOfferingTypesTable offeringTypes={offeringTypes} />
    </section>
  );
}
