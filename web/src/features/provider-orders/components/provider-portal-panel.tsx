"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
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

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VatInvoiceInfo } from "@/features/ecommerce/components/vat-invoice-info";
import { ProviderInput, ProviderSelect } from "@/features/provider-orders/components/provider-form";
import { ProviderOverviewCard, ProviderOverviewGrid } from "@/features/provider-orders/components/provider-overview-card";
import { useRealtimeResource } from "@/features/realtime/use-realtime-resource";
import { ProviderTableActionButton, ProviderTableActions } from "@/features/provider-orders/components/provider-table-actions";
import type { ProviderAssignmentStatus, ProviderOrderSummary } from "@/features/provider-orders/types";
import { providerApi } from "@/lib/api-client.provider";
import type { ProviderPortalStats } from "@/lib/api-client.provider";
import { ROUTES } from "@/lib/routes";
import { getPaymentStatusLabel, getProviderAssignmentStatusLabel } from "@/lib/status-labels";

type ProviderPortalPanelProps = {
  summaryUrl: string;
  initialStats: ProviderPortalStats;
  initialAssignments: ProviderOrderSummary[];
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

function getStatusDotClass(status: ProviderAssignmentStatus) {
  switch (status) {
    case "pending_confirmation":
      return "bg-amber-500";
    case "accepted":
      return "bg-sky-500";
    case "in_progress":
      return "bg-blue-600";
    case "ready_for_review":
      return "bg-violet-500";
    case "completed":
      return "bg-emerald-500";
    case "cancelled":
      return "bg-rose-500";
    default:
      return "bg-zinc-400";
  }
}

function getAssignmentTableCellClassName(columnId: string) {
  switch (columnId) {
    case "orderNumber":
      return "w-[24%] min-w-0";
    case "customerName":
      return "w-[34%] min-w-0";
    case "assignmentStatus":
      return "hidden w-[18%] md:table-cell";
    case "paymentStatus":
      return "hidden w-[14%] lg:table-cell";
    case "updatedAt":
      return "hidden w-[16%] xl:table-cell";
    case "actions":
      return "w-[80px] md:w-[116px]";
    default:
      return undefined;
  }
}

function formatProviderEventMessage(message: string) {
  return message
    .replaceAll("pending_confirmation", getProviderAssignmentStatusLabel("pending_confirmation"))
    .replaceAll("ready_for_review", getProviderAssignmentStatusLabel("ready_for_review"))
    .replaceAll("in_progress", getProviderAssignmentStatusLabel("in_progress"))
    .replaceAll("accepted", getProviderAssignmentStatusLabel("accepted"))
    .replaceAll("completed", getProviderAssignmentStatusLabel("completed"))
    .replaceAll("cancelled", getProviderAssignmentStatusLabel("cancelled"));
}

export function ProviderPortalPanel({
  summaryUrl,
  initialStats,
  initialAssignments,
}: ProviderPortalPanelProps) {
  const [stats, setStats] = useState(initialStats);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [previewAssignmentId, setPreviewAssignmentId] = useState<string | null>(null);

  const previewEntry = useMemo(
    () => assignments.find((entry) => entry.assignment.id === previewAssignmentId) ?? null,
    [assignments, previewAssignmentId]
  );

  const loadSummary = useCallback(async () => {
    return providerApi.fetchProviderPortalSummary(summaryUrl);
  }, [summaryUrl]);

  useRealtimeResource({
    enabled: true,
    streamUrl: ROUTES.API.PROVIDER.REALTIME.PORTAL,
    changedEvent: "provider-portal.changed",
    load: loadSummary,
    onData: (data) => {
      toast.info("Danh sách đơn hàng vừa được cập nhật.");
      setStats(data.stats ?? initialStats);
      setAssignments(data.assignments ?? []);
    },
    onError: () => {
      toast.error("Không thể tải lại danh sách đơn hàng.");
    },
  });

  const columns = useMemo<ColumnDef<ProviderOrderSummary>[]>(
    () => [
      {
        accessorKey: "order.orderNumber",
        id: "orderNumber",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Mã đơn
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="block truncate font-medium text-foreground">{row.original.order.orderNumber}</span>
            {row.original.order.metadata.requestVatInvoice ? (
              <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                VAT
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "order.customerName",
        id: "customerName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Khách hàng
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <p className="truncate">{row.original.order.customerName}</p>
        ),
      },
      {
        accessorKey: "assignment.status",
        id: "assignmentStatus",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Trạng thái
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>(columnId) === filterValue;
        },
        sortingFn: (rowA, rowB) => rowA.original.assignment.status.localeCompare(rowB.original.assignment.status),
        cell: ({ row }) => (
          <span className="inline-flex min-w-0 items-center gap-2 text-sm">
            <span className={`h-2 w-2 rounded-full ${getStatusDotClass(row.original.assignment.status)}`} />
            <span className="truncate">{getProviderAssignmentStatusLabel(row.original.assignment.status)}</span>
          </span>
        ),
      },
      {
        accessorKey: "order.paymentStatus",
        id: "paymentStatus",
        header: "Thanh toán",
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>(columnId) === filterValue;
        },
        cell: ({ row }) => getPaymentStatusLabel(row.original.order.paymentStatus),
      },
      {
        accessorKey: "assignment.updatedAt",
        id: "updatedAt",
        header: ({ column }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Cập nhật
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => <div className="truncate text-right text-sm">{formatDateTime(row.original.assignment.updatedAt)}</div>,
      },
      {
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => (
          <ProviderTableActions>
            <ProviderTableActionButton action="view" label="Xem nhanh" onClick={() => setPreviewAssignmentId(row.original.assignment.id)} />
            <ProviderTableActionButton action="external" label="Mở chi tiết" href={ROUTES.PROVIDER.ORDER(row.original.assignment.id)} />
          </ProviderTableActions>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: assignments,
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
      const keyword = String(filterValue ?? "").trim().toLowerCase();
      if (!keyword) return true;

      const haystack = [
        row.original.order.orderNumber,
        row.original.order.customerName,
        row.original.order.customerEmail,
        row.original.order.customerPhone,
        row.original.order.metadata.requestVatInvoice ? "vat hóa đơn hoa don invoice" : "",
        row.original.lastEvent?.message,
        row.original.assignment.providerReference,
        ...row.original.items.map((item) => item.offeringName),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <ProviderOverviewGrid>
        <ProviderOverviewCard title="Tổng đơn được giao" value={stats.total} />
        <ProviderOverviewCard title="Active" value={stats.active} />
        <ProviderOverviewCard title="Review" value={stats.review} />
        <ProviderOverviewCard title="Completed" value={stats.completed} />
      </ProviderOverviewGrid>

      <Card className="border-zinc-200/80">
        <CardHeader className="gap-4 border-b">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Đơn hàng được giao</CardTitle>
            <div className="flex flex-col gap-3 md:flex-row">
              <ProviderInput
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                placeholder="Tìm theo mã đơn, khách hàng, sản phẩm..."
                className="w-full md:w-72"
              />
              <ProviderSelect
                value={String(table.getColumn("assignmentStatus")?.getFilterValue() ?? "")}
                onChange={(event) => table.getColumn("assignmentStatus")?.setFilterValue(event.target.value)}
                className="md:w-52"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending_confirmation">Pending confirmation</option>
                <option value="accepted">Accepted</option>
                <option value="in_progress">In progress</option>
                <option value="ready_for_review">Ready for review</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </ProviderSelect>
              <ProviderSelect
                value={String(table.getColumn("paymentStatus")?.getFilterValue() ?? "")}
                onChange={(event) => table.getColumn("paymentStatus")?.setFilterValue(event.target.value)}
                className="md:w-48"
              >
                <option value="">Tất cả thanh toán</option>
                <option value="unpaid">Unpaid</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </ProviderSelect>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className={getAssignmentTableCellClassName(header.column.id)}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className={getAssignmentTableCellClassName(cell.column.id)}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                      Chưa có đơn hàng phù hợp với bộ lọc.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(previewEntry)} onOpenChange={(open) => (!open ? setPreviewAssignmentId(null) : null)}>
        <DialogContent className="max-w-2xl">
          {previewEntry ? (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  <span>{previewEntry.order.orderNumber}</span>
                  {previewEntry.order.metadata.requestVatInvoice ? (
                    <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      VAT
                    </span>
                  ) : null}
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-md border p-3 text-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Khách hàng</p>
                  <p className="mt-1 font-medium">{previewEntry.order.customerName}</p>
                  <p className="text-muted-foreground">{previewEntry.order.customerPhone || "Chưa có số điện thoại"}</p>
                  <p className="text-muted-foreground">{previewEntry.order.customerEmail || "Chưa có email"}</p>
                </div>
                <div className="rounded-md border p-3 text-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Trạng thái xử lý</p>
                  <p className="mt-1 font-medium">{getProviderAssignmentStatusLabel(previewEntry.assignment.status)}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">Cập nhật gần nhất</p>
                  <p className="mt-1 font-medium">{formatDateTime(previewEntry.assignment.updatedAt)}</p>
                </div>
              </div>

              <div className="rounded-md border p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Sản phẩm</p>
                <div className="mt-2 space-y-2">
                  {previewEntry.items.map((item) => (
                    <p key={item.id}>
                      {item.offeringName} • Số lượng {item.quantity}
                    </p>
                  ))}
                </div>
              </div>

              <div className="rounded-md border p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Cập nhật mới nhất</p>
                <p className="mt-1">{previewEntry.lastEvent?.message ? formatProviderEventMessage(previewEntry.lastEvent.message) : "Chưa có cập nhật mới."}</p>
              </div>

              {previewEntry.order.metadata.requestVatInvoice ? (
                <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm">
                  <p className="text-xs uppercase tracking-wide text-primary">Hóa đơn VAT</p>
                  <div className="mt-3">
                    <VatInvoiceInfo info={previewEntry.order.metadata.vatInvoiceInfo} />
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end">
                <ProviderTableActionButton action="external" label="Mở chi tiết" href={ROUTES.PROVIDER.ORDER(previewEntry.assignment.id)} />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
