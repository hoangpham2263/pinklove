"use client";

import { type ReactNode, useMemo, useState } from "react";
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

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomerTableActionButton, CustomerTableActions } from "@/features/customer/ui/customer-table-actions";
import { AdminTableClearButton, AdminTableSearch, AdminTableSelect, AdminTableSortButton, AdminTableToolbar } from "@/features/admin/components/admin-table-controls";
import type { EcommerceOrder } from "@/features/ecommerce/types";
import { formatCurrency } from "@/lib/currency";
import { ROUTES } from "@/lib/routes";
import { getFulfillmentStatusLabel, getOrderStatusLabel, getPaymentStatusLabel } from "@/lib/status-labels";

type CustomerOrdersTableProps = {
  orders: EcommerceOrder[];
  currencySettings?: Parameters<typeof formatCurrency>[1];
};

function formatDateTime(value: string | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function OrderBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" }) {
  return (
    <Badge
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : tone === "warning"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-border bg-muted/40 text-muted-foreground"
      }`}
    >
      {children}
    </Badge>
  );
}

function getPaymentTone(status: EcommerceOrder["paymentStatus"]) {
  if (status === "paid") return "success";
  if (status === "pending" || status === "unpaid") return "warning";
  return "neutral";
}

function PreviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-md border p-4">
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </section>
  );
}

function PreviewField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <div className="min-h-9 rounded-md bg-muted/40 px-3 py-2 text-sm text-foreground">{value || "—"}</div>
    </div>
  );
}

export function CustomerOrdersTable({ orders, currencySettings }: CustomerOrdersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [previewOrderId, setPreviewOrderId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<EcommerceOrder>[]>(
    () => [
      {
        accessorKey: "orderNumber",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Đơn hàng
          </AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{row.original.orderNumber}</p>
              {row.original.metadata.requestVatInvoice ? <OrderBadge>VAT</OrderBadge> : null}
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {row.original.items.map((item) => item.offeringName).join(", ")}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        filterFn: (row, columnId, filterValue) => !filterValue || row.getValue<string>(columnId) === filterValue,
        cell: ({ row }) => <OrderBadge>{getOrderStatusLabel(row.original.status)}</OrderBadge>,
      },
      {
        accessorKey: "paymentStatus",
        header: "Thanh toán",
        filterFn: (row, columnId, filterValue) => !filterValue || row.getValue<string>(columnId) === filterValue,
        cell: ({ row }) => <OrderBadge tone={getPaymentTone(row.original.paymentStatus)}>{getPaymentStatusLabel(row.original.paymentStatus)}</OrderBadge>,
      },
      {
        accessorKey: "fulfillmentStatus",
        header: "Giao hàng",
        cell: ({ row }) => getFulfillmentStatusLabel(row.original.fulfillmentStatus),
      },
      {
        accessorKey: "totalAmount",
        header: ({ column }) => (
          <div className="text-right">
            <AdminTableSortButton align="right" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Tổng tiền
            </AdminTableSortButton>
          </div>
        ),
        cell: ({ row }) => <div className="text-right font-medium">{formatCurrency(row.original.totalAmount, currencySettings)}</div>,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Ngày tạo
          </AdminTableSortButton>
        ),
        cell: ({ row }) => formatDateTime(row.original.createdAt),
      },
      {
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <CustomerTableActions>
              <CustomerTableActionButton action="view" label="Xem nhanh" onClick={() => setPreviewOrderId(row.original.id)} />
              <CustomerTableActionButton action="external" label="Chi tiết" href={ROUTES.CUSTOMER.ORDER(row.original.id)} />
            </CustomerTableActions>
          </div>
        ),
      },
    ],
    [currencySettings]
  );

  const table = useReactTable({
    data: orders,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const keyword = String(filterValue).trim().toLowerCase();
      if (!keyword) return true;
      const order = row.original;
      return [
        order.orderNumber,
        order.status,
        order.paymentStatus,
        order.fulfillmentStatus,
        ...order.items.map((item) => item.offeringName),
      ].some((value) => String(value).toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const statusValue = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "";
  const paymentValue = (table.getColumn("paymentStatus")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters = globalFilter.trim().length > 0 || statusValue.length > 0 || paymentValue.length > 0;
  const previewOrder = previewOrderId ? orders.find((order) => order.id === previewOrderId) ?? null : null;
  const statusOptions = Array.from(new Set(orders.map((order) => order.status))).sort();
  const paymentOptions = Array.from(new Set(orders.map((order) => order.paymentStatus))).sort();

  return (
    <div className="space-y-4">
      <AdminTableToolbar>
        <AdminTableSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Tìm mã đơn, sản phẩm..." />
        <AdminTableSelect
          value={statusValue}
          label="Lọc đơn"
          onChange={(value) => table.getColumn("status")?.setFilterValue(value)}
          options={[{ value: "", label: "Tất cả đơn" }, ...statusOptions.map((status) => ({ value: status, label: getOrderStatusLabel(status) }))]}
        />
        <AdminTableSelect
          value={paymentValue}
          label="Lọc thanh toán"
          onChange={(value) => table.getColumn("paymentStatus")?.setFilterValue(value)}
          options={[{ value: "", label: "Tất cả thanh toán" }, ...paymentOptions.map((status) => ({ value: status, label: getPaymentStatusLabel(status) }))]}
        />
        <AdminTableClearButton
          visible={hasFilters}
          onClick={() => {
            setGlobalFilter("");
            table.getColumn("status")?.setFilterValue("");
            table.getColumn("paymentStatus")?.setFilterValue("");
          }}
        />
      </AdminTableToolbar>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Không có đơn phù hợp với bộ lọc hiện tại.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">{table.getFilteredRowModel().rows.length} đơn hàng</p>

      <Dialog open={Boolean(previewOrder)} onOpenChange={(open) => !open && setPreviewOrderId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          {previewOrder ? (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle>{previewOrder.orderNumber}</DialogTitle>
                <DialogDescription>{formatDateTime(previewOrder.createdAt)}</DialogDescription>
              </DialogHeader>
              <PreviewSection title="Tổng quan">
                <div className="grid gap-3 md:grid-cols-2">
                  <PreviewField label="Đơn hàng" value={getOrderStatusLabel(previewOrder.status)} />
                  <PreviewField label="Thanh toán" value={getPaymentStatusLabel(previewOrder.paymentStatus)} />
                  <PreviewField label="Giao hàng" value={getFulfillmentStatusLabel(previewOrder.fulfillmentStatus)} />
                  <PreviewField label="Tổng tiền" value={formatCurrency(previewOrder.totalAmount, currencySettings)} />
                </div>
              </PreviewSection>
              <PreviewSection title="Sản phẩm">
                <div className="divide-y rounded-md border">
                  {previewOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between gap-4 p-3 text-sm">
                      <div>
                        <p className="font-medium">{item.offeringName}</p>
                        <p className="text-muted-foreground">x{item.quantity}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.lineTotal, currencySettings)}</p>
                    </div>
                  ))}
                </div>
              </PreviewSection>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
