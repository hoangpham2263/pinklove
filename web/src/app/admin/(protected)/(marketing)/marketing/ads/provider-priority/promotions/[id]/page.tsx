import { notFound } from "next/navigation";
import { ProviderPromotionForm } from "@/features/ads/admin/ads-entity-forms";
import { getProviderPromotionById, listPlacementOptions, listProviderOptions, listProviderPromotionPlanOptions } from "@/features/ads/server/service";
import { requireAdmin } from "@/lib/auth";

export default async function EditProviderPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [row, providers, plans, placements] = await Promise.all([getProviderPromotionById(id), listProviderOptions(), listProviderPromotionPlanOptions(), listPlacementOptions()]);
  if (!row) notFound();
  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div><h1 className="text-2xl font-bold tracking-tight">Sửa ưu tiên provider</h1><p className="text-sm text-muted-foreground">Cập nhật sponsored provider.</p></div>
      <ProviderPromotionForm row={row} providers={providers} plans={plans} placements={placements} />
    </section>
  );
}
