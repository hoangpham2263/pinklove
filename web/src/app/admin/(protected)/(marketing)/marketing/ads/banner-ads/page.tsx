import { Image } from "lucide-react";

import { AdminCreateLinkButton } from "@/features/admin/components/admin-buttons";
import { AdminAdsPageShell } from "@/features/ads/admin/admin-ads-page-shell";
import { CampaignRowActions } from "@/features/ads/admin/ads-row-actions";
import {
  listAdCampaigns,
} from "@/features/ads/server/service";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminBannerAdsPage() {
  await requireAdmin();
  const rows = await listAdCampaigns();

  return (
    <AdminAdsPageShell
      title="Ads & Announcements"
      description="Quản lý campaign banner, popup, floating và thông báo nội bộ theo từng placement."
      metrics={[
        { title: "Campaigns", value: rows.length, icon: Image },
        { title: "Active", value: rows.filter((row) => row.status === "active").length },
        { title: "Paid / waived", value: rows.filter((row) => row.payment_status === "paid" || row.payment_status === "waived").length },
        { title: "Clicks", value: rows.reduce((total, row) => total + Number(row.clicks ?? 0), 0) },
      ]}
      actions={<AdminCreateLinkButton href={ROUTES.ADMIN.MARKETING_AD_CAMPAIGN_NEW}>Tạo campaign</AdminCreateLinkButton>}
      tableTitle="Danh sách campaign"
      tableDescription="Campaign banner, popup, floating và announcement đã được admin kiểm soát."
      rows={rows}
      columns={[
        { key: "name", label: "Campaign" },
        { key: "placement", label: "Placement" },
        { key: "status", label: "Status" },
        { key: "payment_status", label: "Payment" },
        { key: "priority", label: "Priority" },
        { key: "clicks", label: "Clicks" },
      ]}
      rowActions={(row) => <CampaignRowActions row={row} />}
    />
  );
}
