import { Search } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminDatabasePage } from "@/features/admin/components/admin-database-page";
import { listAbExperiments } from "@/features/admin/server/operations";
import { listAllLandingPages } from "@/features/landing-pages/server/service";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminAbExperimentsPage() {
  await requireAdmin();
  const [rows, landingPages] = await Promise.all([listAbExperiments(), listAllLandingPages()]);

  return (
    <>
      <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
        <div className="rounded-md border bg-background p-5">
          <h1 className="text-2xl font-semibold">A/B Tests</h1>
          <NativeForm action={ROUTES.API.ADMIN.MARKETING.AB_EXPERIMENTS} method="POST" className="mt-4 grid gap-3 md:grid-cols-5">
            <input name="name" placeholder="Tên test" className="h-9 rounded-md border bg-background px-3 text-sm" required />
            <select name="primaryMetric" className="h-9 rounded-md border bg-background px-3 text-sm">
              {["views", "clicks", "add_to_cart", "checkout", "orders", "revenue"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <select name="landingPageId" className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="">Variant landing page</option>
              {landingPages.map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}
            </select>
            <input name="trafficPercent" type="number" min="0" max="100" defaultValue="100" className="h-9 rounded-md border bg-background px-3 text-sm" />
            <AdminSubmitButton>Tạo</AdminSubmitButton>
          </NativeForm>
        </div>
      </section>
      <AdminDatabasePage
        title="A/B Tests"
        description="Cấu hình và theo dõi thử nghiệm landing page theo biến thể và traffic split."
        rows={rows}
        icon={Search}
        metricLabel="Experiments"
        columns={[
          { key: "name", label: "Experiment" },
          { key: "status", label: "Status" },
          { key: "primary_metric", label: "Primary metric" },
          { key: "variants", label: "Variants" },
          { key: "traffic_percent", label: "Traffic %" },
          { key: "started_at", label: "Started" },
          { key: "ended_at", label: "Ended" },
        ]}
      />
    </>
  );
}
