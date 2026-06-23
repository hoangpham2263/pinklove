"use client";

import { useMemo, useState } from "react";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { NativeForm } from "@/components/common/native-form";
import { Badge } from "@/components/ui/badge";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminTableActionButton, AdminTableActions, AdminTableActionTrigger } from "@/features/admin/components/admin-table-actions";
import { AdminTableClearButton, AdminTableSearch, AdminTableSelect, AdminTableToolbar, AdminTableSortButton } from "@/features/admin/components/admin-table-controls";
import type { EcommerceShipment, ShipmentStatus } from "@/features/ecommerce/types";
import { ROUTES } from "@/lib/routes";

const SHIPMENT_STATUSES: ShipmentStatus[] = ["pending", "packing", "shipped", "delivered", "returned", "cancelled"];

type AdminShipmentsTableProps = {
  shipments: EcommerceShipment[];
};

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusVariant(status: ShipmentStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "delivered") return "default";
  if (status === "returned" || status === "cancelled") return "destructive";
  if (status === "shipped") return "outline";
  return "secondary";
}

function ShipmentEditDialog({ shipment }: { shipment: EcommerceShipment }) {
  return (
    <Dialog>
      <AdminTableActionTrigger action="edit" label="Cập nhật shipment" />
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cập nhật shipment</DialogTitle>
          <DialogDescription>Thay đổi trạng thái, đơn vị vận chuyển và mã tracking.</DialogDescription>
        </DialogHeader>
        <NativeForm action={ROUTES.API.ADMIN.SHIPMENTS.UPDATE} method="POST" className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="orderId" value={shipment.orderId} />
          <div className="space-y-2">
            <label className="text-sm">Order ID</label>
            <Input value={shipment.orderId} disabled />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Trạng thái</label>
            <select name="status" defaultValue={shipment.status} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              {SHIPMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm">Carrier</label>
            <Input name="carrier" defaultValue={shipment.carrier} />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Tracking</label>
            <Input name="trackingNumber" defaultValue={shipment.trackingNumber} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm">Ghi chú</label>
            <Input name="notes" defaultValue={shipment.notes} />
          </div>
          <div className="md:col-span-2">
            <AdminSubmitButton>Lưu</AdminSubmitButton>
          </div>
        </NativeForm>
      </DialogContent>
    </Dialog>
  );
}

export function AdminShipmentsTable({ shipments }: AdminShipmentsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [previewShipmentId, setPreviewShipmentId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<EcommerceShipment>[]>(
    () => [
      {
        accessorKey: "orderId",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Order</AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <p>{row.original.orderId}</p>
            <p className="text-xs text-muted-foreground">Shipment ID: {row.original.id}</p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Trạng thái</AdminTableSortButton>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>(columnId) === filterValue;
        },
        cell: ({ row }) => <Badge variant={getStatusVariant(row.original.status)}>{row.original.status}</Badge>,
      },
      {
        accessorKey: "carrier",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Carrier</AdminTableSortButton>
        ),
        cell: ({ row }) => row.original.carrier || <span className="text-muted-foreground">-</span>,
      },
      {
        accessorKey: "trackingNumber",
        header: "Tracking",
        cell: ({ row }) => row.original.trackingNumber || <span className="text-muted-foreground">-</span>,
      },
      {
        accessorKey: "shippedAt",
        header: "Shipped",
        cell: ({ row }) => formatDate(row.original.shippedAt),
      },
      {
        accessorKey: "deliveredAt",
        header: "Delivered",
        cell: ({ row }) => formatDate(row.original.deliveredAt),
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Cập nhật</AdminTableSortButton>
        ),
        cell: ({ row }) => formatDate(row.original.updatedAt),
      },
      {
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => (
          <AdminTableActions>
            <AdminTableActionButton action="view" label="Xem shipment" onClick={() => setPreviewShipmentId(row.original.id)} />
            <AdminTableActionButton action="external" label="Mở đơn hàng" href={ROUTES.ADMIN.ORDER(row.original.orderId)} />
            <ShipmentEditDialog shipment={row.original} />
          </AdminTableActions>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: shipments,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const keyword = String(filterValue).trim().toLowerCase();
      if (!keyword) return true;

      const shipment = row.original;
      return [shipment.id, shipment.orderId, shipment.carrier, shipment.trackingNumber, shipment.status, shipment.notes]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const statusFilterValue = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters = globalFilter.trim().length > 0 || statusFilterValue.length > 0;
  const previewShipment = previewShipmentId ? shipments.find((shipment) => shipment.id === previewShipmentId) ?? null : null;

  return (
    <>
    <div className="space-y-4">
      <AdminTableToolbar>
        <AdminTableSearch
          value={globalFilter}
          onChange={setGlobalFilter}
          placeholder="Tìm theo order, carrier, tracking..."
        />
        <AdminTableSelect
          value={statusFilterValue}
          label="Lọc trạng thái"
          onChange={(value) => table.getColumn("status")?.setFilterValue(value)}
          options={[
            { value: "", label: "Tất cả trạng thái" },
            ...SHIPMENT_STATUSES.map((status) => ({ value: status, label: status })),
          ]}
        />
        <AdminTableClearButton
          visible={hasFilters}
          onClick={() => {
            setGlobalFilter("");
            table.getColumn("status")?.setFilterValue("");
          }}
        />
      </AdminTableToolbar>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-medium">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Không có shipment phù hợp với bộ lọc hiện tại.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
    <Dialog open={Boolean(previewShipment)} onOpenChange={(open) => !open && setPreviewShipmentId(null)}>
      <DialogContent>
        {previewShipment ? (
          <>
            <DialogHeader>
              <DialogTitle>Chi tiết shipment</DialogTitle>
              <DialogDescription>Thông tin vận chuyển và tracking của đơn hàng.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Shipment ID</p>
                <p className="break-all text-sm">{previewShipment.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Order ID</p>
                <p className="break-all text-sm">{previewShipment.orderId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Trạng thái</p>
                <Badge variant={getStatusVariant(previewShipment.status)}>{previewShipment.status}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Carrier</p>
                <p className="text-sm">{previewShipment.carrier || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tracking</p>
                <p className="break-all text-sm">{previewShipment.trackingNumber || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Shipped</p>
                <p className="text-sm">{formatDate(previewShipment.shippedAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Delivered</p>
                <p className="text-sm">{formatDate(previewShipment.deliveredAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Cập nhật</p>
                <p className="text-sm">{formatDate(previewShipment.updatedAt)}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs text-muted-foreground">Ghi chú</p>
                <p className="whitespace-pre-wrap rounded-md border p-3 text-sm">{previewShipment.notes || "-"}</p>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
    </>
  );
}
