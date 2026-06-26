import { BadgePercent } from "lucide-react";

import { AdminCreateLinkButton } from "@/features/admin/components/admin-buttons";
import { AdminAdsPageShell } from "@/features/ads/admin/admin-ads-page-shell";
import { MarketingCampaignRowActions } from "@/features/admin/components/marketing/marketing-campaign-row-actions";
import { listCampaigns } from "@/features/admin/server/operations";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminCampaignsPage() {
  await requireAdmin();
  const rows = await listCampaigns();

  return (
    <AdminAdsPageShell
      title="Campaigns"
      description="Theo dõi chiến dịch marketing theo kênh, landing page và hiệu quả chuyển đổi."
      metrics={[
        { title: "Campaigns", value: rows.length, icon: BadgePercent },
        { title: "Active", value: rows.filter((row) => row.status === "active").length },
        { title: "Clicks", value: rows.reduce((total, row) => total + Number(row.clicks ?? 0), 0) },
        { title: "Orders", value: rows.reduce((total, row) => total + Number(row.orders ?? 0), 0) },
      ]}
      actions={<AdminCreateLinkButton href={ROUTES.ADMIN.MARKETING_CAMPAIGN_NEW}>Tạo campaign</AdminCreateLinkButton>}
      tableTitle="Danh sách campaign"
      tableDescription="Campaign marketing gắn với landing page."
      rows={rows}
      columns={[
        { key: "name", label: "Campaign" },
        { key: "channel", label: "Channel" },
        { key: "status", label: "Status" },
        { key: "landing_page", label: "Landing page" },
        { key: "budget", label: "Budget" },
        { key: "clicks", label: "Clicks" },
        { key: "orders", label: "Orders" },
      ]}
      rowActions={(row) => <MarketingCampaignRowActions row={row} />}
    />
  );
}
