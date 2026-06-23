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
import type { EcommerceOrder, FulfillmentStatus, OrderStatus, PaymentStatus } from "@/features/ecommerce/types";
import { ROUTES } from "@/lib/routes";
import { getFulfillmentStatusLabel, getOrderStatusLabel, getPaymentStatusLabel } from "@/lib/status-labels";

const ORDER_STATUSES: OrderStatus[] = ["pending_payment", "paid", "processing", "ready_to_ship", "shipped", "completed", "cancelled", "refunded"];
const PAYMENT_STATUSES: PaymentStatus[] = ["unpaid", "pending", "paid", "failed", "refunded"];
const FULFILLMENT_STATUSES: FulfillmentStatus[] = ["not_required", "pending", "processing", "shipped", "delivered", "cancelled"];

export type AdminOrderRow = EcommerceOrder & {
  totalAmountLabel: string;
};

type AdminOrdersTableProps = {
  orders: AdminOrderRow[];
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

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "paid" || status === "completed" || status === "delivered") return "default";
  if (status === "cancelled" || status === "refunded" || status === "failed") return "destructive";
  if (status === "shipped" || status === "ready_to_ship") return "outline";
  return "secondary";
}

function OrderEditDialog({ order }: { order: AdminOrderRow }) {
  return (
    <Dialog>
      <AdminTableActionTrigger action="edit" label="Cập nhật đơn hàng" />
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cập nhật đơn hàng</DialogTitle>
          <DialogDescription>Thay đổi trạng thái đơn hàng, thanh toán và fulfillment.</DialogDescription>
        </DialogHeader>
        <NativeForm action={ROUTES.API.ADMIN.ORDERS.UPDATE} method="POST" className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="orderId" value={order.id} />
          <div className="space-y-2">
            <label className="text-sm">Mã đơn</label>
            <Input value={order.orderNumber} disabled />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Tổng tiền</label>
            <Input value={order.totalAmountLabel} disabled />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Trạng thái đơn</label>
            <select name="status" defaultValue={order.status} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {getOrderStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm">Thanh toán</label>
            <select name="paymentStatus" defaultValue={order.paymentStatus} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {getPaymentStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm">Fulfillment</label>
            <select name="fulfillmentStatus" defaultValue={order.fulfillmentStatus} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              {FULFILLMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {getFulfillmentStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm">Ghi chú</label>
            <Input name="notes" defaultValue={order.notes} />
          </div>
          <div className="md:col-span-2">
            <AdminSubmitButton>Lưu</AdminSubmitButton>
          </div>
        </NativeForm>
      </DialogContent>
    </Dialog>
  );
}

export function AdminOrdersTable({ orders }: AdminOrdersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<AdminOrderRow>[]>(
    () => [
      {
        accessorKey: "orderNumber",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Đơn hàng</AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <p>{row.original.orderNumber}</p>
            <p className="text-xs text-muted-foreground">{row.original.customerName}</p>
            {row.original.metadata.requestVatInvoice ? (
              <Badge variant="outline" className="w-fit">VAT</Badge>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "customerEmail",
        header: "Khách hàng",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p>{row.original.customerEmail || "-"}</p>
            <p className="text-xs text-muted-foreground">{row.original.customerPhone || "-"}</p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Đơn</AdminTableSortButton>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>(columnId) === filterValue;
        },
        cell: ({ row }) => <Badge variant={getStatusVariant(row.original.status)}>{getOrderStatusLabel(row.original.status)}</Badge>,
      },
      {
        accessorKey: "paymentStatus",
        header: "Thanh toán",
        cell: ({ row }) => <Badge variant={getStatusVariant(row.original.paymentStatus)}>{getPaymentStatusLabel(row.original.paymentStatus)}</Badge>,
      },
      {
        accessorKey: "fulfillmentStatus",
        header: "Fulfillment",
        cell: ({ row }) => <Badge variant={getStatusVariant(row.original.fulfillmentStatus)}>{getFulfillmentStatusLabel(row.original.fulfillmentStatus)}</Badge>,
      },
      {
        accessorKey: "totalAmount",
        header: ({ column }) => (
          <div className="text-right">
            <AdminTableSortButton align="right" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Tổng tiền</AdminTableSortButton>
          </div>
        ),
        cell: ({ row }) => <div className="text-right">{row.original.totalAmountLabel}</div>,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Tạo lúc</AdminTableSortButton>
        ),
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => (
          <AdminTableActions>
            <AdminTableActionButton action="view" label="Chi tiết" href={ROUTES.ADMIN.ORDER(row.original.id)} />
            <OrderEditDialog order={row.original} />
          </AdminTableActions>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: orders,
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

      const order = row.original;
      return [
        order.orderNumber,
        order.customerName,
        order.customerEmail,
        order.customerPhone,
        order.status,
        order.paymentStatus,
        order.fulfillmentStatus,
        order.metadata.requestVatInvoice ? "vat hóa đơn hoa don invoice" : "",
        order.items.map((item) => item.offeringName).join(" "),
      ]
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

  return (
    <div className="space-y-4">
      <AdminTableToolbar>
        <AdminTableSearch
          value={globalFilter}
          onChange={setGlobalFilter}
          placeholder="Tìm theo mã đơn, khách hàng, sản phẩm..."
        />
        <AdminTableSelect
          value={statusFilterValue}
          label="Lọc trạng thái"
          onChange={(value) => table.getColumn("status")?.setFilterValue(value)}
          options={[
            { value: "", label: "Tất cả trạng thái" },
            ...ORDER_STATUSES.map((status) => ({ value: status, label: getOrderStatusLabel(status) })),
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
                  Không có đơn hàng phù hợp với bộ lọc hiện tại.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
