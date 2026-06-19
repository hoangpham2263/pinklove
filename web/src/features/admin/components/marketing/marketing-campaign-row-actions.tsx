import { NativeForm } from "@/components/common/native-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminTableActionButton, AdminTableActionTrigger, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import { ROUTES } from "@/lib/routes";

type Row = Record<string, unknown>;

function text(row: Row, key: string) {
  const value = row[key];
  return typeof value === "string" ? value : value === null || value === undefined ? "" : String(value);
}

export function MarketingCampaignRowActions({ row }: { row: Row }) {
  return (
    <AdminTableActions>
      <Dialog>
        <AdminTableActionTrigger action="view" label="Xem nhanh" />
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{text(row, "name") || "Campaign"}</DialogTitle>
            <DialogDescription>Thông tin nhanh campaign marketing.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(row).map(([key, value]) => (
              <div key={key} className="space-y-1 rounded-md border p-3">
                <p className="text-xs uppercase text-muted-foreground">{key}</p>
                <p className="break-words text-sm">{value === null || value === undefined || value === "" ? "—" : String(value)}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <AdminTableActionButton action="edit" label="Chỉnh sửa" href={ROUTES.ADMIN.MARKETING_CAMPAIGN(text(row, "id"))} />
      <NativeForm action={ROUTES.API.ADMIN.MARKETING.CAMPAIGNS} method="POST" className="inline-block">
        <input type="hidden" name="intent" value="archive" />
        <input type="hidden" name="id" value={text(row, "id")} />
        <AdminTableActionButton action="delete" label="Archive campaign" type="submit" />
      </NativeForm>
    </AdminTableActions>
  );
}
