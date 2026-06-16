import { BriefcaseBusiness } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminDialogCreateTrigger, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminField, AdminInput, AdminSelect, AdminTextarea } from "@/features/admin/components/admin-form";
import { AdminAdsPageShell } from "@/features/ads/admin/admin-ads-page-shell";
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
        <Dialog>
          <AdminDialogCreateTrigger>Tạo advertiser</AdminDialogCreateTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Tạo advertiser</DialogTitle>
              <DialogDescription>Advertiser là entity nghiệp vụ do admin quản lý, không tạo role đăng nhập.</DialogDescription>
            </DialogHeader>
            <NativeForm action={ROUTES.API.ADMIN.MARKETING.ADS.ADVERTISERS} method="POST" className="grid gap-4 md:grid-cols-3">
            <AdminField label="Tên advertiser" required>
              <AdminInput name="name" required />
            </AdminField>
            <AdminField label="Người liên hệ">
              <AdminInput name="contactName" />
            </AdminField>
            <AdminField label="Email">
              <AdminInput name="contactEmail" type="email" />
            </AdminField>
            <AdminField label="Phone">
              <AdminInput name="contactPhone" />
            </AdminField>
            <AdminField label="Website">
              <AdminInput name="websiteUrl" />
            </AdminField>
            <AdminField label="Status">
              <AdminSelect name="status" defaultValue="active">
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="archived">archived</option>
              </AdminSelect>
            </AdminField>
            <AdminField label="Ghi chú" className="md:col-span-3">
              <AdminTextarea name="notes" rows={3} />
            </AdminField>
            <div className="md:col-span-3">
              <AdminSubmitButton>Tạo advertiser</AdminSubmitButton>
            </div>
            </NativeForm>
          </DialogContent>
        </Dialog>
      }
      tableTitle="Danh sách advertiser"
      tableDescription="Hồ sơ đơn vị thuê đặt quảng cáo do admin kiểm soát."
      rows={rows}
      columns={[
        { key: "name", label: "Advertiser" },
        { key: "contact_name", label: "Contact" },
        { key: "contact_email", label: "Email" },
        { key: "contact_phone", label: "Phone" },
        { key: "website_url", label: "Website" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
