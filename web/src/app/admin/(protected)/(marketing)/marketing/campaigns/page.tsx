import { BadgePercent } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminDatabasePage } from "@/features/admin/components/admin-database-page";
import { listCampaigns } from "@/features/admin/server/operations";
import { listAllLandingPages } from "@/features/landing-pages/server/service";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminCampaignsPage() {
  await requireAdmin();
  const [rows, landingPages] = await Promise.all([listCampaigns(), listAllLandingPages()]);

  return (
    <>
      <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
        <div className="rounded-md border bg-background p-5">
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <NativeForm action={ROUTES.API.ADMIN.MARKETING.CAMPAIGNS} method="POST" className="mt-4 grid gap-3 md:grid-cols-5">
            <input name="name" placeholder="Tên campaign" className="h-9 rounded-md border bg-background px-3 text-sm" required />
            <select name="channel" className="h-9 rounded-md border bg-background px-3 text-sm">
              {["facebook", "tiktok", "google", "email", "affiliate", "organic"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <select name="landingPageId" className="h-9 rounded-md border bg-background px-3 text-sm" required>
              <option value="">Landing page</option>
              {landingPages.map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}
            </select>
            <input name="budget" type="number" min="0" placeholder="Budget" className="h-9 rounded-md border bg-background px-3 text-sm" />
            <AdminSubmitButton>Tạo</AdminSubmitButton>
          </NativeForm>
        </div>
      </section>
      <AdminDatabasePage
        title="Campaigns"
        description="Theo dõi chiến dịch marketing theo kênh, landing page và hiệu quả chuyển đổi."
        rows={rows}
        icon={BadgePercent}
        metricLabel="Campaigns"
        columns={[
          { key: "name", label: "Campaign" },
          { key: "channel", label: "Channel" },
          { key: "status", label: "Status" },
          { key: "landing_page", label: "Landing page" },
          { key: "budget", label: "Budget" },
          { key: "views", label: "Views" },
          { key: "clicks", label: "Clicks" },
          { key: "orders", label: "Orders" },
          { key: "revenue", label: "Revenue" },
        ]}
      />
    </>
  );
}
