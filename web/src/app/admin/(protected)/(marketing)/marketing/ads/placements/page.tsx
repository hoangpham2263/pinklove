import { PanelsTopLeft } from "lucide-react";

import { AdminCreateLinkButton } from "@/features/admin/components/admin-buttons";
import { AdminAdsPageShell } from "@/features/ads/admin/admin-ads-page-shell";
import { PlacementRowActions } from "@/features/ads/admin/ads-row-actions";
import { listAdPlacements } from "@/features/ads/server/service";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminAdPlacementsPage() {
  await requireAdmin();
  const rows = await listAdPlacements();

  return (
    <AdminAdsPageShell
      title="Placements"
      description="Danh mục vị trí render banner và provider priority."
      metrics={[
        { title: "Placements", value: rows.length, icon: PanelsTopLeft },
        { title: "Active", value: rows.filter((row) => row.is_active === true).length },
        { title: "Banner", value: rows.filter((row) => row.placement_type === "banner").length },
        { title: "Provider listing", value: rows.filter((row) => row.placement_type === "provider_listing").length },
      ]}
      actions={
        <AdminCreateLinkButton href={ROUTES.ADMIN.MARKETING_AD_PLACEMENT_NEW}>Tạo placement</AdminCreateLinkButton>
      }
      tableTitle="Danh sách placement"
      tableDescription="Vị trí dùng chung cho external ads và provider priority."
      rows={rows}
      columns={[
        { key: "key", label: "Key" },
        { key: "label", label: "Label" },
        { key: "placement_type", label: "Type" },
        { key: "display_mode", label: "Mode" },
        { key: "is_active", label: "Active" },
      ]}
      rowActions={(row) => <PlacementRowActions row={row} />}
    />
  );
}
