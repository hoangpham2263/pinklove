import { ProviderPromotionForm } from "@/features/ads/admin/ads-entity-forms";
import { listPlacementOptions, listProviderOptions, listProviderPromotionPlanOptions } from "@/features/ads/server/service";
import { requireAdmin } from "@/lib/auth";

export default async function NewProviderPromotionPage() {
  await requireAdmin();
  const [providers, plans, placements] = await Promise.all([listProviderOptions(), listProviderPromotionPlanOptions(), listPlacementOptions()]);
  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div><h1 className="text-2xl font-bold tracking-tight">Tạo ưu tiên provider</h1><p className="text-sm text-muted-foreground">Sponsored provider hiển thị top.</p></div>
      <ProviderPromotionForm providers={providers} plans={plans} placements={placements} />
    </section>
  );
}
