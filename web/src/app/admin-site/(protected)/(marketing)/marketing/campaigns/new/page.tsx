import { MarketingCampaignForm } from "@/features/admin/components/marketing/marketing-campaign-form";
import { listAllLandingPages } from "@/features/landing-pages/server/service";
import { requireAdmin } from "@/lib/auth";

export default async function NewMarketingCampaignPage() {
  await requireAdmin();
  const landingPages = await listAllLandingPages();
  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tạo campaign</h1>
        <p className="text-sm text-muted-foreground">Campaign marketing gắn với landing page.</p>
      </div>
      <MarketingCampaignForm landingPages={landingPages} />
    </section>
  );
}
