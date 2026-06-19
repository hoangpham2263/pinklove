import { notFound } from "next/navigation";
import { ProviderPlanForm } from "@/features/ads/admin/ads-entity-forms";
import { getProviderPromotionPlanById, listPlacementOptions } from "@/features/ads/server/service";
import { requireAdmin } from "@/lib/auth";

export default async function EditProviderPlanPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [row, placements] = await Promise.all([getProviderPromotionPlanById(id), listPlacementOptions()]);
  if (!row) notFound();
  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div><h1 className="text-2xl font-bold tracking-tight">Sửa gói ưu tiên</h1><p className="text-sm text-muted-foreground">Cập nhật gói sponsored provider.</p></div>
      <ProviderPlanForm row={row} placements={placements} />
    </section>
  );
}
