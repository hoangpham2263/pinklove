import { NativeForm } from "@/components/common/native-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminTableActionButton, AdminTableActionTrigger, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import { ROUTES } from "@/lib/routes";

type Row = Record<string, unknown>;

function text(row: Row, key: string) {
  const value = row[key];
  return typeof value === "string" ? value : value === null || value === undefined ? "" : String(value);
}

function Preview({ row, title, description }: { row: Row; title: string; description: string }) {
  const entries = Object.entries(row).filter(([key]) => key !== "metadata");
  return (
    <Dialog>
      <AdminTableActionTrigger action="view" label="Xem nhanh" />
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          {entries.map(([key, value]) => (
            <div key={key} className="space-y-1 rounded-md border p-3">
              <p className="text-xs uppercase text-muted-foreground">{key}</p>
              <p className="break-words text-sm">{value === null || value === undefined || value === "" ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value)}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function archiveForm(action: string, id: string, label: string) {
  return (
    <NativeForm action={action} method="POST" className="inline-block">
      <input type="hidden" name="intent" value="archive" />
      <input type="hidden" name="id" value={id} />
      <AdminTableActionButton action="delete" label={label} type="submit" />
    </NativeForm>
  );
}

export function AdvertiserRowActions({ row }: { row: Row }) {
  return (
    <AdminTableActions>
      <Preview row={row} title={text(row, "name") || "Advertiser"} description="Thông tin advertiser." />
      <AdminTableActionButton action="edit" label="Chỉnh sửa" href={ROUTES.ADMIN.MARKETING_ADVERTISER(text(row, "id"))} />
      {archiveForm(ROUTES.API.ADMIN.MARKETING.ADS.ADVERTISERS, text(row, "id"), "Archive advertiser")}
    </AdminTableActions>
  );
}

export function PlacementRowActions({ row }: { row: Row }) {
  return (
    <AdminTableActions>
      <Preview row={row} title={text(row, "label") || "Placement"} description="Thông tin placement và target rules." />
      <AdminTableActionButton action="edit" label="Chỉnh sửa" href={ROUTES.ADMIN.MARKETING_AD_PLACEMENT(text(row, "id"))} />
      {archiveForm(ROUTES.API.ADMIN.MARKETING.ADS.PLACEMENTS, text(row, "id"), "Tắt placement")}
    </AdminTableActions>
  );
}

export function CreativeRowActions({ row }: { row: Row }) {
  return (
    <AdminTableActions>
      <Preview row={row} title={text(row, "title") || "Creative"} description="Thông tin creative." />
      <AdminTableActionButton action="edit" label="Chỉnh sửa" href={ROUTES.ADMIN.MARKETING_AD_CREATIVE(text(row, "id"))} />
      {archiveForm(ROUTES.API.ADMIN.MARKETING.ADS.CREATIVES, text(row, "id"), "Archive creative")}
    </AdminTableActions>
  );
}

export function CampaignRowActions({ row }: { row: Row }) {
  return (
    <AdminTableActions>
      <Preview row={row} title={text(row, "name") || "Campaign"} description="Thông tin campaign." />
      <AdminTableActionButton action="edit" label="Chỉnh sửa" href={ROUTES.ADMIN.MARKETING_AD_CAMPAIGN(text(row, "id"))} />
      {archiveForm(ROUTES.API.ADMIN.MARKETING.ADS.CAMPAIGNS, text(row, "id"), "Archive campaign")}
    </AdminTableActions>
  );
}

export function ProviderPlanRowActions({ row }: { row: Row }) {
  return (
    <AdminTableActions>
      <Preview row={row} title={text(row, "name") || "Plan"} description="Thông tin gói ưu tiên." />
      <AdminTableActionButton action="edit" label="Chỉnh sửa" href={ROUTES.ADMIN.MARKETING_PROVIDER_PRIORITY_PLAN(text(row, "id"))} />
      {archiveForm(ROUTES.API.ADMIN.MARKETING.ADS.PROVIDER_PLANS, text(row, "id"), "Tắt gói")}
    </AdminTableActions>
  );
}

export function ProviderPromotionRowActions({ row }: { row: Row }) {
  return (
    <AdminTableActions>
      <Preview row={row} title={text(row, "title") || "Provider promotion"} description="Thông tin sponsored provider." />
      <AdminTableActionButton action="edit" label="Chỉnh sửa" href={ROUTES.ADMIN.MARKETING_PROVIDER_PRIORITY_PROMOTION(text(row, "id"))} />
      {archiveForm(ROUTES.API.ADMIN.MARKETING.ADS.PROVIDER_PROMOTIONS, text(row, "id"), "Archive ưu tiên")}
    </AdminTableActions>
  );
}
