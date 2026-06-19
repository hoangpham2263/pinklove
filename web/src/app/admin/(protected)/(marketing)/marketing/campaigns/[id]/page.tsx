import { notFound } from "next/navigation";

import { MarketingCampaignForm } from "@/features/admin/components/marketing/marketing-campaign-form";
import { getCampaignById } from "@/features/admin/server/operations";
import { listAllLandingPages } from "@/features/landing-pages/server/service";
import { requireAdmin } from "@/lib/auth";

export default async function EditMarketingCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [row, landingPages] = await Promise.all([getCampaignById(id), listAllLandingPages()]);
  if (!row) notFound();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sửa campaign</h1>
        <p className="text-sm text-muted-foreground">Cập nhật channel, landing page, status và budget.</p>
      </div>
      <MarketingCampaignForm row={row} landingPages={landingPages} />
    </section>
  );
}
