import { BriefcaseBusiness } from "lucide-react";

import { AdminCreateLinkButton } from "@/features/admin/components/admin-buttons";
import { AdminAdsPageShell } from "@/features/ads/admin/admin-ads-page-shell";
import { AdvertiserRowActions } from "@/features/ads/admin/ads-row-actions";
import { listAdvertisers } from "@/features/ads/server/service";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminAdvertisersPage() {
  await requireAdmin();
  const rows = await listAdvertisers();

  return (
    <AdminAdsPageShell
      title="Advertisers"
      description="Bên ngoài thuê PinkLove đặt banner. Không phải account login."
      metrics={[
        { title: "Advertisers", value: rows.length, icon: BriefcaseBusiness },
        { title: "Đang hoạt động", value: rows.filter((row) => row.status === "active").length },
        { title: "Inactive", value: rows.filter((row) => row.status === "inactive").length },
        { title: "Archived", value: rows.filter((row) => row.status === "archived").length },
      ]}
      actions={
        <AdminCreateLinkButton href={ROUTES.ADMIN.MARKETING_ADVERTISER_NEW}>Tạo advertiser</AdminCreateLinkButton>
      }
      tableTitle="Danh sách advertiser"
      tableDescription="Hồ sơ đơn vị thuê đặt quảng cáo do admin kiểm soát."
      rows={rows}
      columns={[
        { key: "name", label: "Advertiser" },
        { key: "contact_name", label: "Contact" },
        { key: "contact_email", label: "Email" },
        { key: "status", label: "Status" },
      ]}
      rowActions={(row) => <AdvertiserRowActions row={row} />}
    />
  );
}
