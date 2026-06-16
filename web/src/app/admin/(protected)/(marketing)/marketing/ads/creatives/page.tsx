import { Image } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminDialogCreateTrigger, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminField, AdminInput, AdminSelect, AdminTextarea } from "@/features/admin/components/admin-form";
import { AdminAdsPageShell } from "@/features/ads/admin/admin-ads-page-shell";
import { listAdCreatives, listAdvertiserOptions } from "@/features/ads/server/service";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminAdCreativesPage() {
  await requireAdmin();
  const [rows, advertisers] = await Promise.all([listAdCreatives(), listAdvertiserOptions()]);

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
      actions={
        <Dialog>
          <AdminDialogCreateTrigger>Tạo creative</AdminDialogCreateTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Tạo creative</DialogTitle>
              <DialogDescription>Creative hiện dùng URL ảnh đã kiểm soát. Media picker/upload sẽ là bước riêng nếu cần.</DialogDescription>
            </DialogHeader>
            <NativeForm action={ROUTES.API.ADMIN.MARKETING.ADS.CREATIVES} method="POST" className="grid gap-4 md:grid-cols-3">
            <AdminField label="Advertiser">
              <AdminSelect name="advertiserId">
                <option value="">PinkLove / nội bộ</option>
                {advertisers.map((advertiser) => <option key={advertiser.id} value={advertiser.id}>{advertiser.label}</option>)}
              </AdminSelect>
            </AdminField>
            <AdminField label="Tên creative" required>
              <AdminInput name="title" required />
            </AdminField>
            <AdminField label="Status">
              <AdminSelect name="status" defaultValue="draft">
                <option value="draft">draft</option>
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
                <option value="archived">archived</option>
              </AdminSelect>
            </AdminField>
            <AdminField label="Image URL" required>
              <AdminInput name="imageUrl" required />
            </AdminField>
            <AdminField label="Mobile image URL">
              <AdminInput name="mobileImageUrl" />
            </AdminField>
            <AdminField label="Target URL">
              <AdminInput name="targetUrl" />
            </AdminField>
            <AdminField label="Alt text">
              <AdminInput name="altText" />
            </AdminField>
            <AdminField label="Headline">
              <AdminInput name="headline" />
            </AdminField>
            <AdminField label="CTA">
              <AdminInput name="ctaLabel" />
            </AdminField>
            <AdminField label="Body" className="md:col-span-3">
              <AdminTextarea name="body" rows={3} />
            </AdminField>
            <div className="md:col-span-3">
              <AdminSubmitButton>Tạo creative</AdminSubmitButton>
            </div>
            </NativeForm>
          </DialogContent>
        </Dialog>
      }
      tableTitle="Danh sách creative"
      tableDescription="Danh sách banner/creative đã tạo."
      rows={rows}
      columns={[
        { key: "title", label: "Creative" },
        { key: "advertiser", label: "Advertiser" },
        { key: "creative_type", label: "Type" },
        { key: "status", label: "Status" },
        { key: "image_url", label: "Image" },
        { key: "target_url", label: "Target" },
      ]}
    />
  );
}
