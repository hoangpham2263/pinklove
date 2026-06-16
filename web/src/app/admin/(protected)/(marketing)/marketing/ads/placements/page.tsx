import { PanelsTopLeft } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminDialogCreateTrigger, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminField, AdminInput, AdminSelect, AdminTextarea } from "@/features/admin/components/admin-form";
import { AdminAdsPageShell } from "@/features/ads/admin/admin-ads-page-shell";
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
        <Dialog>
          <AdminDialogCreateTrigger>Tạo placement</AdminDialogCreateTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Tạo hoặc cập nhật placement</DialogTitle>
              <DialogDescription>Placement key là contract để public UI fetch đúng vị trí.</DialogDescription>
            </DialogHeader>
            <NativeForm action={ROUTES.API.ADMIN.MARKETING.ADS.PLACEMENTS} method="POST" className="grid gap-4 md:grid-cols-3">
            <AdminField label="Key" required>
              <AdminInput name="key" placeholder="provider_directory_top" required />
            </AdminField>
            <AdminField label="Tên placement" required>
              <AdminInput name="label" required />
            </AdminField>
            <AdminField label="Loại">
              <AdminSelect name="placementType" defaultValue="banner">
                <option value="banner">banner</option>
                <option value="provider_listing">provider_listing</option>
                <option value="offering_listing">offering_listing</option>
                <option value="mixed">mixed</option>
              </AdminSelect>
            </AdminField>
            <AdminField label="Surface">
              <AdminSelect name="surface" defaultValue="website">
                <option value="website">website</option>
                <option value="provider_directory">provider_directory</option>
                <option value="category">category</option>
                <option value="search">search</option>
                <option value="blog">blog</option>
                <option value="checkout">checkout</option>
                <option value="footer">footer</option>
              </AdminSelect>
            </AdminField>
            <AdminField label="Max items">
              <AdminInput name="maxItems" type="number" min="1" defaultValue="1" />
            </AdminField>
            <AdminField label="Active">
              <AdminSelect name="isActive" defaultValue="true">
                <option value="true">true</option>
                <option value="false">false</option>
              </AdminSelect>
            </AdminField>
            <AdminField label="Mô tả" className="md:col-span-3">
              <AdminTextarea name="description" rows={3} />
            </AdminField>
            <div className="md:col-span-3">
              <AdminSubmitButton>Lưu placement</AdminSubmitButton>
            </div>
            </NativeForm>
          </DialogContent>
        </Dialog>
      }
      tableTitle="Danh sách placement"
      tableDescription="Vị trí dùng chung cho external ads và provider priority."
      rows={rows}
      columns={[
        { key: "key", label: "Key" },
        { key: "label", label: "Label" },
        { key: "placement_type", label: "Type" },
        { key: "surface", label: "Surface" },
        { key: "max_items", label: "Max" },
        { key: "is_active", label: "Active" },
      ]}
    />
  );
}
