import { Image } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminDialogCreateTrigger, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminField, AdminInput, AdminSelect, AdminTextarea } from "@/features/admin/components/admin-form";
import { AdminAdsPageShell } from "@/features/ads/admin/admin-ads-page-shell";
import {
  listAdCampaigns,
  listAdvertiserOptions,
  listCreativeOptions,
  listPlacementOptions,
} from "@/features/ads/server/service";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminBannerAdsPage() {
  await requireAdmin();
  const [rows, advertisers, placements, creatives] = await Promise.all([
    listAdCampaigns(),
    listAdvertiserOptions(),
    listPlacementOptions(),
    listCreativeOptions(),
  ]);

  return (
    <AdminAdsPageShell
      title="Banner Ads"
      description="Campaign quảng cáo thuê ngoài, tách riêng khỏi campaign marketing nội bộ."
      metrics={[
        { title: "Banner Ads", value: rows.length, icon: Image },
        { title: "Active", value: rows.filter((row) => row.status === "active").length },
        { title: "Paid / waived", value: rows.filter((row) => row.payment_status === "paid" || row.payment_status === "waived").length },
        { title: "Clicks", value: rows.reduce((total, row) => total + Number(row.clicks ?? 0), 0) },
      ]}
      actions={
        <Dialog>
          <AdminDialogCreateTrigger>Tạo banner ad</AdminDialogCreateTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Tạo banner ad</DialogTitle>
              <DialogDescription>Admin kiểm soát advertiser, creative, placement, thanh toán và thời gian chạy.</DialogDescription>
            </DialogHeader>
            <NativeForm action={ROUTES.API.ADMIN.MARKETING.ADS.CAMPAIGNS} method="POST" className="grid gap-4 md:grid-cols-3">
            <AdminField label="Tên campaign" required>
              <AdminInput name="name" required />
            </AdminField>
            <AdminField label="Advertiser" required>
              <AdminSelect name="advertiserId" required>
                <option value="">Chọn advertiser</option>
                {advertisers.map((advertiser) => <option key={advertiser.id} value={advertiser.id}>{advertiser.label}</option>)}
              </AdminSelect>
            </AdminField>
            <AdminField label="Placement" required>
              <AdminSelect name="placementId" required>
                <option value="">Chọn placement</option>
                {placements.map((placement) => <option key={placement.id} value={placement.id}>{placement.label}</option>)}
              </AdminSelect>
            </AdminField>
            <AdminField label="Creative">
              <AdminSelect name="creativeId">
                <option value="">Chưa gắn creative</option>
                {creatives.map((creative) => <option key={creative.id} value={creative.id}>{creative.label}</option>)}
              </AdminSelect>
            </AdminField>
            <AdminField label="Status">
              <AdminSelect name="status" defaultValue="draft">
                <option value="draft">draft</option>
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="expired">expired</option>
                <option value="rejected">rejected</option>
                <option value="archived">archived</option>
              </AdminSelect>
            </AdminField>
            <AdminField label="Payment">
              <AdminSelect name="paymentStatus" defaultValue="unpaid">
                <option value="unpaid">unpaid</option>
                <option value="pending">pending</option>
                <option value="paid">paid</option>
                <option value="refunded">refunded</option>
                <option value="waived">waived</option>
              </AdminSelect>
            </AdminField>
            <AdminField label="Price">
              <AdminInput name="price" type="number" min="0" step="1000" defaultValue="0" />
            </AdminField>
            <AdminField label="Start">
              <AdminInput name="startsAt" type="datetime-local" />
            </AdminField>
            <AdminField label="End">
              <AdminInput name="endsAt" type="datetime-local" />
            </AdminField>
            <AdminField label="Target URL">
              <AdminInput name="targetUrl" />
            </AdminField>
            <AdminField label="Notes" className="md:col-span-2">
              <AdminTextarea name="notes" rows={3} />
            </AdminField>
            <div className="md:col-span-3">
              <AdminSubmitButton>Tạo banner ad</AdminSubmitButton>
            </div>
            </NativeForm>
          </DialogContent>
        </Dialog>
      }
      tableTitle="Danh sách banner ad"
      tableDescription="Campaign banner thuê ngoài đã được admin kiểm soát."
      rows={rows}
      columns={[
        { key: "name", label: "Campaign" },
        { key: "advertiser", label: "Advertiser" },
        { key: "placement", label: "Placement" },
        { key: "creative", label: "Creative" },
        { key: "status", label: "Status" },
        { key: "payment_status", label: "Payment" },
        { key: "price", label: "Price" },
        { key: "impressions", label: "Views" },
        { key: "clicks", label: "Clicks" },
      ]}
    />
  );
}
