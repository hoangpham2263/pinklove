"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, FilterX } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminTableActionButton, AdminTableActions, AdminTableActionTrigger } from "@/features/admin/components/admin-table-actions";
import type { EcommercePayment } from "@/features/ecommerce/types";
import { ROUTES } from "@/lib/routes";

const PAYMENT_STATUSES: EcommercePayment["status"][] = ["pending", "paid", "failed", "refunded"];

export type AdminPaymentRow = EcommercePayment & {
  amountLabel: string;
  methodLabel: string;
};

type AdminPaymentsTableProps = {
  payments: AdminPaymentRow[];
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

function getStatusVariant(status: EcommercePayment["status"]): "default" | "secondary" | "destructive" | "outline" {
  if (status === "paid") return "default";
  if (status === "failed") return "destructive";
  if (status === "refunded") return "outline";
  return "secondary";
}

function PaymentEditDialog({ payment }: { payment: AdminPaymentRow }) {
  return (
    <Dialog>
      <AdminTableActionTrigger action="edit" label="Cập nhật payment" />
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cập nhật payment</DialogTitle>
          <DialogDescription>Thay đổi trạng thái thanh toán và mã tham chiếu ngoài.</DialogDescription>
        </DialogHeader>
        <form action={ROUTES.API.ADMIN.PAYMENTS.UPDATE} method="POST" className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="paymentId" value={payment.id} />
          <div className="space-y-2">
            <label className="text-sm">Payment ID</label>
            <Input value={payment.id} disabled />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Trạng thái</label>
            <select name="status" defaultValue={payment.status} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm">Phương thức</label>
            <Input value={payment.methodLabel} disabled />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Số tiền</label>
            <Input value={payment.amountLabel} disabled />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm">External ref</label>
            <Input name="externalRef" defaultValue={payment.externalRef ?? ""} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Lưu</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AdminPaymentsTable({ payments }: AdminPaymentsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [previewPaymentId, setPreviewPaymentId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<AdminPaymentRow>[]>(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Payment
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <p>{row.original.id}</p>
            <p className="text-xs text-muted-foreground">Order: {row.original.orderId}</p>
          </div>
        ),
      },
      {
        accessorKey: "methodLabel",
        header: "Phương thức",
        cell: ({ row }) => row.original.methodLabel,
      },
      {
        accessorKey: "amount",
        header: ({ column }) => (
          <div className="text-right">
            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Số tiền
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => <div className="text-right">{row.original.amountLabel}</div>,
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Trạng thái
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>(columnId) === filterValue;
        },
        cell: ({ row }) => <Badge variant={getStatusVariant(row.original.status)}>{row.original.status}</Badge>,
      },
      {
        accessorKey: "externalRef",
        header: "External ref",
        cell: ({ row }) => row.original.externalRef || <span className="text-muted-foreground">-</span>,
      },
      {
        accessorKey: "paidAt",
        header: "Paid at",
        cell: ({ row }) => formatDate(row.original.paidAt),
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Cập nhật
            <ArrowUpDown className="h-4 w-4" />
          </Button>
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
            <AdminTableActionButton action="view" label="Xem payment" onClick={() => setPreviewPaymentId(row.original.id)} />
            <AdminTableActionButton action="external" label="Mở đơn hàng" href={ROUTES.ADMIN.ORDER(row.original.orderId)} />
            <PaymentEditDialog payment={row.original} />
          </AdminTableActions>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: payments,
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

      const payment = row.original;
      return [payment.id, payment.orderId, payment.method, payment.methodLabel, payment.provider, payment.status, payment.externalRef]
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
  const previewPayment = previewPaymentId ? payments.find((payment) => payment.id === previewPaymentId) ?? null : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,320px)_220px_auto]">
        <Input
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder="Tìm theo payment, order, external ref..."
          className="h-9"
        />
        <select
          value={statusFilterValue}
          onChange={(event) => table.getColumn("status")?.setFilterValue(event.target.value)}
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none"
        >
          <option value="">Tất cả trạng thái</option>
          {PAYMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        {hasFilters ? (
          <Button
            variant="default"
            size="icon-lg"
            aria-label="Xóa bộ lọc"
            title="Xóa bộ lọc"
            onClick={() => {
              setGlobalFilter("");
              table.getColumn("status")?.setFilterValue("");
            }}
          >
            <FilterX className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

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
                  Không có payment phù hợp với bộ lọc hiện tại.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(previewPayment)} onOpenChange={(open) => !open && setPreviewPaymentId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {previewPayment ? (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle>Chi tiết payment</DialogTitle>
                <DialogDescription>Xem nhanh thông tin giao dịch trước khi cập nhật.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm">Payment ID</p>
                  <p className="break-all text-sm text-muted-foreground">{previewPayment.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Order ID</p>
                  <p className="break-all text-sm text-muted-foreground">{previewPayment.orderId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Phương thức</p>
                  <p className="text-sm text-muted-foreground">{previewPayment.methodLabel}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Provider</p>
                  <p className="text-sm text-muted-foreground">{previewPayment.provider || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Số tiền</p>
                  <p className="text-sm text-muted-foreground">{previewPayment.amountLabel}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Trạng thái</p>
                  <Badge variant={getStatusVariant(previewPayment.status)}>{previewPayment.status}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Paid at</p>
                  <p className="text-sm text-muted-foreground">{formatDate(previewPayment.paidAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Cập nhật</p>
                  <p className="text-sm text-muted-foreground">{formatDate(previewPayment.updatedAt)}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm">External ref</p>
                <p className="break-all rounded-md border p-3 text-sm text-muted-foreground">{previewPayment.externalRef || "-"}</p>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  render={<Link href={ROUTES.ADMIN.ORDER(previewPayment.orderId)}>Mở đơn hàng</Link>}
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
