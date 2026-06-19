import { CampaignForm } from "@/features/ads/admin/ads-entity-forms";
import { getTargetUrlOptions } from "@/features/ads/admin/target-url-options";
import { listAdvertiserOptions, listCreativeOptions, listPlacementOptions } from "@/features/ads/server/service";
import { requireAdmin } from "@/lib/auth";

export default async function NewCampaignPage() {
  await requireAdmin();
  const [advertisers, placements, creatives, targetUrlOptions] = await Promise.all([listAdvertiserOptions(), listPlacementOptions(), listCreativeOptions(), getTargetUrlOptions()]);
  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div><h1 className="text-2xl font-bold tracking-tight">Tạo campaign</h1><p className="text-sm text-muted-foreground">Campaign banner, popup, floating hoặc announcement.</p></div>
      <CampaignForm advertisers={advertisers} placements={placements} creatives={creatives} targetUrlOptions={targetUrlOptions} />
    </section>
  );
}
