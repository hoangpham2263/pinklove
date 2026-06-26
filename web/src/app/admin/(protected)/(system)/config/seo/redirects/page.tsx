import { CheckCircle2, Link2, MoveRight, ToggleLeft } from "lucide-react";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { SeoRedirectsManager } from "@/features/admin/components/settings/seo-redirects-manager";
import { requireAdmin } from "@/lib/auth";
import { listSeoRedirectRules } from "@/lib/seo-redirects";

export const dynamic = "force-dynamic";

export default async function AdminSeoRedirectsPage() {
  await requireAdmin();
  const rules = await listSeoRedirectRules();
  const activeCount = rules.filter((rule) => rule.enabled).length;
  const permanentCount = rules.filter((rule) => rule.statusCode === 301).length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid>
        <AdminOverviewCard title="Tổng redirect" value={rules.length} icon={Link2} />
        <AdminOverviewCard title="Đang hoạt động" value={activeCount} icon={CheckCircle2} />
        <AdminOverviewCard title="Permanent 301" value={permanentCount} icon={MoveRight} />
        <AdminOverviewCard title="Temporary 302" value={rules.length - permanentCount} icon={ToggleLeft} />
      </AdminOverviewGrid>

      <SeoRedirectsManager rules={rules} />
    </section>
  );
}
