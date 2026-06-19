import { NativeForm } from "@/components/common/native-form";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminField, AdminInput, AdminSelect } from "@/features/admin/components/admin-form";
import { ROUTES } from "@/lib/routes";

type Row = Record<string, unknown>;
type LandingPageOption = { id: string; name: string };

function text(row: Row | null | undefined, key: string) {
  const value = row?.[key];
  return typeof value === "string" ? value : value === null || value === undefined ? "" : String(value);
}

export function MarketingCampaignForm({ row, landingPages }: { row?: Row | null; landingPages: LandingPageOption[] }) {
  return (
    <NativeForm action={ROUTES.API.ADMIN.MARKETING.CAMPAIGNS} method="POST" className="grid gap-4 md:grid-cols-3">
      <input type="hidden" name="intent" value={row ? "update" : "create"} />
      {row ? <input type="hidden" name="id" value={text(row, "id")} /> : null}
      <AdminField label="Tên campaign" required>
        <AdminInput name="name" defaultValue={text(row, "name")} required />
      </AdminField>
      <AdminField label="Channel">
        <AdminSelect name="channel" defaultValue={text(row, "channel") || "organic"}>
          {["facebook", "tiktok", "google", "email", "affiliate", "organic"].map((item) => <option key={item} value={item}>{item}</option>)}
        </AdminSelect>
      </AdminField>
      <AdminField label="Status">
        <AdminSelect name="status" defaultValue={text(row, "status") || "draft"}>
          {["draft", "active", "paused", "completed", "archived"].map((item) => <option key={item} value={item}>{item}</option>)}
        </AdminSelect>
      </AdminField>
      <AdminField label="Landing page" required>
        <AdminSelect name="landingPageId" defaultValue={text(row, "landing_page_id")} required>
          <option value="">Chọn landing page</option>
          {landingPages.map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}
        </AdminSelect>
      </AdminField>
      <AdminField label="Budget">
        <AdminInput name="budget" type="number" min="0" step="1000" defaultValue={text(row, "budget") || "0"} />
      </AdminField>
      <div className="flex items-end">
        <AdminSubmitButton>{row ? "Lưu campaign" : "Tạo campaign"}</AdminSubmitButton>
      </div>
    </NativeForm>
  );
}
