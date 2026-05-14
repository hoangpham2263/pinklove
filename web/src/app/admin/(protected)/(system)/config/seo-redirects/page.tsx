import { CheckCircle2, Link2, MoveRight, ToggleLeft } from "lucide-react";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { SeoRedirectsManager } from "@/features/admin/components/settings/seo-redirects-manager";
import { requireAdmin } from "@/lib/auth";
import { getSystemSettings } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

export default async function AdminSeoRedirectsPage() {
  await requireAdmin();
  const settings = await getSystemSettings();
  const rules = settings.redirects.rules;
  const activeRules = rules.filter((rule) => rule.enabled);
  const permanentRules = rules.filter((rule) => rule.statusCode === 301);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid>
        <AdminOverviewCard title="Total Redirects" value={rules.length} icon={Link2} />
        <AdminOverviewCard title="Active" value={activeRules.length} icon={CheckCircle2} />
        <AdminOverviewCard title="Permanent" value={permanentRules.length} icon={MoveRight} />
        <AdminOverviewCard title="Temporary" value={rules.length - permanentRules.length} icon={ToggleLeft} />
      </AdminOverviewGrid>

      <SeoRedirectsManager rules={rules} />
    </section>
  );
}
