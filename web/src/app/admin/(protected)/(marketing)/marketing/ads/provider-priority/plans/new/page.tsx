import { ProviderPlanForm } from "@/features/ads/admin/ads-entity-forms";
import { listPlacementOptions } from "@/features/ads/server/service";
import { requireAdmin } from "@/lib/auth";

export default async function NewProviderPlanPage() {
  await requireAdmin();
  const placements = await listPlacementOptions();
  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div><h1 className="text-2xl font-bold tracking-tight">Tạo gói ưu tiên</h1><p className="text-sm text-muted-foreground">Gói sponsored provider.</p></div>
      <ProviderPlanForm placements={placements} />
    </section>
  );
}
