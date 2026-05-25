"use client";

import { PackageCheck, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdminCreateLinkButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminTableActionButton, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import { AdminTableClearButton, AdminTableSearch, AdminTableToolbar } from "@/features/admin/components/admin-table-controls";
import { formatVnd } from "@/lib/currency";
import { ROUTES } from "@/lib/routes";
import type { ShippingAccountSettings } from "@/lib/system-settings";
import { useState } from "react";

type ShippingConnectionsTableProps = {
  connections: ShippingAccountSettings[];
};

export function ShippingConnectionsTable({ connections }: ShippingConnectionsTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const enabledCount = connections.filter((connection) => connection.enabled).length;
  const keyword = globalFilter.trim().toLowerCase();
  const filteredConnections = keyword
    ? connections.filter((connection) =>
        [
          connection.code,
          connection.provider,
          connection.accountLabel,
          connection.shopId,
          connection.pickupAddressId,
        ].some((value) => value.toLowerCase().includes(keyword))
      )
    : connections;
  const previewConnection = previewCode ? connections.find((connection) => connection.code === previewCode) ?? null : null;

  return (
    <div className="space-y-5">
      <AdminOverviewGrid className="md:grid-cols-2 lg:grid-cols-2">
        <AdminOverviewCard title="Shipping Connections" value={connections.length} icon={Truck} />
        <AdminOverviewCard title="Đang bật" value={enabledCount} icon={PackageCheck} />
      </AdminOverviewGrid>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <AdminTableToolbar>
            <AdminTableSearch
              value={globalFilter}
              onChange={setGlobalFilter}
              placeholder="Tìm theo provider, mã, shop, pickup..."
            />
            <AdminTableClearButton visible={Boolean(globalFilter.trim())} onClick={() => setGlobalFilter("")} />
          </AdminTableToolbar>
          <div className="flex flex-wrap items-center gap-2">
            <AdminCreateLinkButton href={ROUTES.ADMIN.CONFIG_SHIPPING_NEW}>Thêm</AdminCreateLinkButton>
          </div>
        </div>

        <div className="rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phương thức</TableHead>
                <TableHead>Mã nội bộ</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Shop / Merchant</TableHead>
                <TableHead>Phí ship</TableHead>
                <TableHead>Miễn phí từ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConnections.length > 0 ? (
                filteredConnections.map((connection) => (
                  <TableRow key={connection.code}>
                    <TableCell>{connection.accountLabel || connection.provider || connection.code}</TableCell>
                    <TableCell className="text-muted-foreground">{connection.code}</TableCell>
                    <TableCell>{connection.provider || "-"}</TableCell>
                    <TableCell>{connection.shopId || "-"}</TableCell>
                    <TableCell>{formatVnd(connection.flatShippingFee)}</TableCell>
                    <TableCell>{formatVnd(connection.freeShippingThreshold)}</TableCell>
                    <TableCell>
                      <form
                        id={`shipping-toggle-${connection.code}`}
                        action={ROUTES.API.ADMIN.CONFIG.SHIPPING_SAVE}
                        method="POST"
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="intent" value="toggle-enabled" />
                        <input type="hidden" name="code" value={connection.code} />
                        <input type="hidden" name="enabled" value={connection.enabled ? "off" : "on"} />
                        <Switch
                          checked={connection.enabled}
                          aria-label={connection.enabled ? "Tắt kết nối vận chuyển" : "Bật kết nối vận chuyển"}
                          onCheckedChange={() => {
                            const form = document.getElementById(`shipping-toggle-${connection.code}`) as HTMLFormElement | null;
                            form?.requestSubmit();
                          }}
                        />
                      </form>
                    </TableCell>
                    <TableCell>
                      <AdminTableActions>
                        <Badge variant="secondary">{connection.pickupAddressId ? "Pickup mapped" : "No pickup"}</Badge>
                        <AdminTableActionButton action="view" label="Xem nhanh" onClick={() => setPreviewCode(connection.code)} />
                        <AdminTableActionButton action="edit" label="Sửa shipping" href={ROUTES.ADMIN.CONFIG_SHIPPING_CONNECTION(connection.code)} />
                        <form
                          action={ROUTES.API.ADMIN.CONFIG.SHIPPING_DELETE}
                          method="POST"
                          onSubmit={(event) => {
                            if (!confirm(`Xóa kết nối vận chuyển "${connection.accountLabel || connection.provider || connection.code}"?`)) {
                              event.preventDefault();
                            }
                          }}
                        >
                          <input type="hidden" name="code" value={connection.code} />
                          <AdminTableActionButton action="delete" label="Xóa shipping" type="submit" />
                        </form>
                      </AdminTableActions>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-20 text-center text-muted-foreground">
                    Không có phương thức vận chuyển phù hợp.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={Boolean(previewConnection)} onOpenChange={(open) => !open && setPreviewCode(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {previewConnection ? (
            <div className="space-y-5">
              <DialogHeader>
                <DialogTitle>{previewConnection.accountLabel || previewConnection.provider || previewConnection.code}</DialogTitle>
                <DialogDescription>Xem nhanh cấu hình phương thức vận chuyển.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Mã nội bộ</p>
                  <p className="text-sm text-muted-foreground">{previewConnection.code}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Provider</p>
                  <p className="text-sm text-muted-foreground">{previewConnection.provider || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Shop / Merchant</p>
                  <p className="text-sm text-muted-foreground">{previewConnection.shopId || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Pickup Address ID</p>
                  <p className="text-sm text-muted-foreground">{previewConnection.pickupAddressId || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Phí ship</p>
                  <p className="text-sm text-muted-foreground">{formatVnd(previewConnection.flatShippingFee)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Miễn phí từ</p>
                  <p className="text-sm text-muted-foreground">{formatVnd(previewConnection.freeShippingThreshold)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Trạng thái</p>
                  <p className="text-sm text-muted-foreground">{previewConnection.enabled ? "Đang bật" : "Đang tắt"}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">API Token / Key</p>
                <p className="break-all rounded-md border p-3 text-sm text-muted-foreground">
                  {previewConnection.token || "-"}
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
