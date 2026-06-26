import { Activity, Blocks, LayoutTemplate } from "lucide-react";
import { AdminOverviewCard } from "@/features/admin/components/admin-overview-card";
import { LandingPagesTable } from "@/features/landing-pages/admin/landing-pages-table";
import { listAllLandingPages } from "@/features/landing-pages/server/service";
import { requireAdmin } from "@/lib/auth";

export default async function AdminProductLandingPagesIndex() {
  await requireAdmin();
  const landingPages = await listAllLandingPages();
  const publishedCount = landingPages.filter((landingPage) => landingPage.status === "published").length;
  const totalSections = landingPages.reduce((sum, landingPage) => sum + (landingPage.sectionCount ?? 0), 0);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <h1 className="text-2xl font-bold tracking-tight">Landing pages</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <AdminOverviewCard title="Landing" value={landingPages.length} icon={LayoutTemplate} />
        <AdminOverviewCard title="Đã xuất bản" value={publishedCount} icon={Activity} />
        <AdminOverviewCard title="Sections" value={totalSections} icon={Blocks} />
      </div>

      <LandingPagesTable landingPages={landingPages} />
    </section>
  );
}
