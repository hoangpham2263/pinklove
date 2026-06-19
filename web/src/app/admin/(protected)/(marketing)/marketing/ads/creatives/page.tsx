import { Image } from "lucide-react";

import { AdminCreateLinkButton } from "@/features/admin/components/admin-buttons";
import { AdminAdsPageShell } from "@/features/ads/admin/admin-ads-page-shell";
import { CreativeRowActions } from "@/features/ads/admin/ads-row-actions";
import { listAdCreatives } from "@/features/ads/server/service";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminAdCreativesPage() {
  await requireAdmin();
  const rows = await listAdCreatives();

  return (
    <AdminAdsPageShell
      title="Creatives"
      description="Banner, CTA và link đích do admin kiểm duyệt."
      metrics={[
        { title: "Creatives", value: rows.length, icon: Image },
        { title: "Approved", value: rows.filter((row) => row.status === "approved").length },
        { title: "Pending", value: rows.filter((row) => row.status === "pending").length },
        { title: "Draft / khác", value: rows.filter((row) => row.status !== "approved" && row.status !== "pending").length },
      ]}
      actions={<AdminCreateLinkButton href={ROUTES.ADMIN.MARKETING_AD_CREATIVE_NEW}>Tạo creative</AdminCreateLinkButton>}
      tableTitle="Danh sách creative"
      tableDescription="Danh sách banner/creative đã tạo."
      rows={rows}
      columns={[
        { key: "title", label: "Creative" },
        { key: "advertiser", label: "Advertiser" },
        { key: "status", label: "Status" },
        { key: "badge_label", label: "Badge" },
      ]}
      rowActions={(row) => <CreativeRowActions row={row} />}
    />
  );
}
