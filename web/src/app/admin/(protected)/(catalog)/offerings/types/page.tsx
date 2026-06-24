import { AdminOverviewCard } from "@/features/admin/components/admin-overview-card";
import { listOfferingTypes } from "@/features/offerings/server/service";
import { SYSTEM_OFFERING_TYPES } from "@/features/offerings/types";
import { requireAdmin } from "@/lib/auth";
import { Boxes, Camera, Database, Package } from "lucide-react";
import { AdminOfferingTypesTable } from "./admin-offering-types-table";

export default async function AdminOfferingTypesPage() {
  await requireAdmin();
  const offeringTypes = (await listOfferingTypes()).filter(
    (type) => type.key !== SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE
  );
  const physicalCount = offeringTypes.filter((type) => type.fulfillmentType === "physical").length;
  const serviceCount = offeringTypes.filter((type) => type.fulfillmentType === "service").length;
  const fieldCount = offeringTypes.reduce((sum, type) => sum + type.fieldSchema.length, 0);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Offering Types</h1>
        <p className="text-sm text-muted-foreground">
          Type được đăng ký trong code. Tại đây chỉ quản lý field definitions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminOverviewCard title="Type code" value={offeringTypes.length} icon={Boxes} />
        <AdminOverviewCard title="Sản phẩm vật lý" value={physicalCount} icon={Package} />
        <AdminOverviewCard title="Dịch vụ" value={serviceCount} icon={Camera} />
        <AdminOverviewCard title="Fields" value={fieldCount} icon={Database} />
      </div>

      <AdminOfferingTypesTable offeringTypes={offeringTypes} />
    </section>
  );
}
