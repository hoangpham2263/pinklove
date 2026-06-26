import { notFound } from "next/navigation";
import { CampaignForm } from "@/features/ads/admin/ads-entity-forms";
import { getTargetUrlOptions } from "@/features/ads/admin/target-url-options";
import { getAdCampaignById, listAdvertiserOptions, listCreativeOptions, listPlacementOptions } from "@/features/ads/server/service";
import { requireAdmin } from "@/lib/auth";

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [row, advertisers, placements, creatives, targetUrlOptions] = await Promise.all([getAdCampaignById(id), listAdvertiserOptions(), listPlacementOptions(), listCreativeOptions(), getTargetUrlOptions()]);
  if (!row) notFound();
  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div><h1 className="text-2xl font-bold tracking-tight">Sửa campaign</h1><p className="text-sm text-muted-foreground">Cập nhật campaign và trạng thái chạy.</p></div>
      <CampaignForm row={row} advertisers={advertisers} placements={placements} creatives={creatives} targetUrlOptions={targetUrlOptions} />
    </section>
  );
}
