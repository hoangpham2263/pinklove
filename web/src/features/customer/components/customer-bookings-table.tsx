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
import { AdminTableClearButton, AdminTableSearch, AdminTableSelect, AdminTableSortButton, AdminTableToolbar } from "@/features/admin/components/admin-table-controls";
import type { BookingListRow, BookingStatus } from "@/features/bookings/server/service";
import { CustomerTableActionButton, CustomerTableActions } from "@/features/customer/ui/customer-table-actions";
import { formatCurrency } from "@/lib/currency";

type CustomerBookingsTableProps = {
  bookings: BookingListRow[];
};

const bookingStatusLabels: Record<BookingStatus, string> = {
  draft: "Draft",
  requested: "Đã yêu cầu",
  confirmed: "Đã xác nhận",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Chưa đặt lịch";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function BookingBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" }) {
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

function getBookingTone(status: BookingStatus) {
  if (status === "confirmed" || status === "completed") return "success";
  if (status === "requested" || status === "draft") return "warning";
  return "neutral";
}

function PreviewField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <div className="min-h-9 rounded-md bg-muted/40 px-3 py-2 text-sm text-foreground">{value || "—"}</div>
    </div>
  );
}

export function CustomerBookingsTable({ bookings }: CustomerBookingsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [previewBookingId, setPreviewBookingId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<BookingListRow>[]>(
    () => [
      {
        accessorKey: "booking_number",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Booking
          </AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium">{row.original.booking_number}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{row.original.providers || "Chưa gắn provider"}</p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        filterFn: (row, columnId, filterValue) => !filterValue || row.getValue<string>(columnId) === filterValue,
        cell: ({ row }) => (
          <BookingBadge tone={getBookingTone(row.original.status)}>
            {bookingStatusLabels[row.original.status] ?? row.original.status}
          </BookingBadge>
        ),
      },
      {
        accessorKey: "latest_payment_status",
        header: "Thanh toán",
        filterFn: (row, columnId, filterValue) => !filterValue || row.getValue<string | null>(columnId) === filterValue,
        cell: ({ row }) => row.original.latest_payment_status || "Chưa có",
      },
      {
        accessorKey: "scheduled_at",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Lịch hẹn
          </AdminTableSortButton>
        ),
        cell: ({ row }) => formatDateTime(row.original.scheduled_at),
      },
      {
        accessorKey: "item_count",
        header: "Hạng mục",
        cell: ({ row }) => `${row.original.item_count} mục`,
      },
      {
        accessorKey: "total_amount",
        header: ({ column }) => (
          <div className="text-right">
            <AdminTableSortButton align="right" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Tổng tiền
            </AdminTableSortButton>
          </div>
        ),
        cell: ({ row }) => <div className="text-right font-medium">{formatCurrency(row.original.total_amount)}</div>,
      },
      {
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <CustomerTableActions>
              <CustomerTableActionButton action="view" label="Xem nhanh" onClick={() => setPreviewBookingId(row.original.id)} />
            </CustomerTableActions>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: bookings,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const keyword = String(filterValue).trim().toLowerCase();
      if (!keyword) return true;
      const booking = row.original;
      return [
        booking.booking_number,
        booking.providers,
        booking.status,
        booking.latest_payment_status,
        booking.latest_status_note,
      ].some((value) => String(value ?? "").toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const statusValue = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "";
  const paymentValue = (table.getColumn("latest_payment_status")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters = globalFilter.trim().length > 0 || statusValue.length > 0 || paymentValue.length > 0;
  const previewBooking = previewBookingId ? bookings.find((booking) => booking.id === previewBookingId) ?? null : null;
  const statusOptions = Array.from(new Set(bookings.map((booking) => booking.status))).sort();
  const paymentOptions = Array.from(new Set(bookings.map((booking) => booking.latest_payment_status).filter(Boolean) as string[])).sort();

  return (
    <div className="space-y-4">
      <AdminTableToolbar>
        <AdminTableSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Tìm booking, provider, cập nhật..." />
        <AdminTableSelect
          value={statusValue}
          label="Lọc trạng thái"
          onChange={(value) => table.getColumn("status")?.setFilterValue(value)}
          options={[{ value: "", label: "Tất cả trạng thái" }, ...statusOptions.map((status) => ({ value: status, label: bookingStatusLabels[status] ?? status }))]}
        />
        <AdminTableSelect
          value={paymentValue}
          label="Lọc thanh toán"
          onChange={(value) => table.getColumn("latest_payment_status")?.setFilterValue(value)}
          options={[{ value: "", label: "Tất cả thanh toán" }, ...paymentOptions.map((status) => ({ value: status, label: status }))]}
        />
        <AdminTableClearButton
          visible={hasFilters}
          onClick={() => {
            setGlobalFilter("");
            table.getColumn("status")?.setFilterValue("");
            table.getColumn("latest_payment_status")?.setFilterValue("");
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
                  Không có booking phù hợp với bộ lọc hiện tại.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">{table.getFilteredRowModel().rows.length} booking</p>

      <Dialog open={Boolean(previewBooking)} onOpenChange={(open) => !open && setPreviewBookingId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          {previewBooking ? (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle>{previewBooking.booking_number}</DialogTitle>
                <DialogDescription>{formatDateTime(previewBooking.created_at)}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 md:grid-cols-2">
                <PreviewField label="Trạng thái" value={bookingStatusLabels[previewBooking.status] ?? previewBooking.status} />
                <PreviewField label="Provider" value={previewBooking.providers || "Chưa gắn provider"} />
                <PreviewField label="Lịch hẹn" value={formatDateTime(previewBooking.scheduled_at)} />
                <PreviewField label="Thanh toán" value={previewBooking.latest_payment_status || "Chưa có"} />
                <PreviewField label="Hạng mục" value={`${previewBooking.item_count} mục`} />
                <PreviewField label="Tổng tiền" value={formatCurrency(previewBooking.total_amount)} />
              </div>
              <PreviewField label="Cập nhật mới nhất" value={previewBooking.latest_status_note || "Chưa có cập nhật"} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
