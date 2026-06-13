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
import { AdminTableActionButton, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import { AdminTableClearButton, AdminTableSearch, AdminTableSelect, AdminTableSortButton, AdminTableToolbar } from "@/features/admin/components/admin-table-controls";
import type { VendorLeadAdminRow } from "@/features/providers/server/leads";

type AdminProviderLeadsTableProps = {
  rows: VendorLeadAdminRow[];
};

function formatMoney(value: string | null) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return "—";
  return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function StatusBadge({ value, tone = "lead" }: { value: string | null; tone?: "lead" | "quote" }) {
  const normalized = value || "none";
  const positive = normalized === "won" || normalized === "accepted";
  const pending = normalized === "new" || normalized === "contacted" || normalized === "quoted" || normalized === "sent";
  return (
    <Badge
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        positive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : pending
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : tone === "quote" && normalized === "none"
              ? "border-muted bg-muted/40 text-muted-foreground"
              : "border-border bg-muted/40 text-muted-foreground"
      }`}
    >
      {value || "Chưa có"}
    </Badge>
  );
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

export function AdminProviderLeadsTable({ rows }: AdminProviderLeadsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [previewLeadId, setPreviewLeadId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<VendorLeadAdminRow>[]>(
    () => [
      {
        accessorKey: "provider",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Provider
          </AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium">{row.original.provider}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.offering || "Yêu cầu chung"}</p>
          </div>
        ),
      },
      {
        accessorKey: "customer",
        header: "Customer",
        cell: ({ row }) => row.original.customer || <span className="text-muted-foreground">Guest</span>,
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Lead status
          </AdminTableSortButton>
        ),
        filterFn: (row, columnId, filterValue) => !filterValue || row.getValue<string>(columnId) === filterValue,
        cell: ({ row }) => <StatusBadge value={row.original.status} />,
      },
      {
        accessorKey: "quote_status",
        header: "Quote",
        filterFn: (row, columnId, filterValue) => !filterValue || row.getValue<string | null>(columnId) === filterValue,
        cell: ({ row }) => (
          <div className="space-y-1">
            <StatusBadge value={row.original.quote_status} tone="quote" />
            <p className="text-xs text-muted-foreground">{formatMoney(row.original.quote_amount)}</p>
          </div>
        ),
      },
      {
        accessorKey: "budget",
        header: ({ column }) => (
          <div className="text-right">
            <AdminTableSortButton align="right" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Budget
            </AdminTableSortButton>
          </div>
        ),
        cell: ({ row }) => <div className="text-right">{formatMoney(row.original.budget)}</div>,
      },
      {
        accessorKey: "event_date",
        header: "Event date",
        cell: ({ row }) => formatDate(row.original.event_date),
      },
      {
        accessorKey: "updated_at",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Updated
          </AdminTableSortButton>
        ),
        cell: ({ row }) => formatDateTime(row.original.updated_at),
      },
      {
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <AdminTableActions>
              <AdminTableActionButton action="view" label="Xem lead" onClick={() => setPreviewLeadId(row.original.id)} />
            </AdminTableActions>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const keyword = String(filterValue).trim().toLowerCase();
      if (!keyword) return true;
      const lead = row.original;
      return [lead.provider, lead.customer, lead.offering, lead.status, lead.quote_status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const leadStatusValue = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "";
  const quoteStatusValue = (table.getColumn("quote_status")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters = globalFilter.trim().length > 0 || leadStatusValue.length > 0 || quoteStatusValue.length > 0;
  const previewLead = previewLeadId ? rows.find((row) => row.id === previewLeadId) ?? null : null;

  const leadStatusOptions = Array.from(new Set(rows.map((row) => row.status).filter(Boolean))).sort();
  const quoteStatusOptions = Array.from(new Set(rows.map((row) => row.quote_status).filter(Boolean) as string[])).sort();

  return (
    <div className="space-y-4">
      <AdminTableToolbar>
        <AdminTableSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Tìm provider, customer, offering..." />
        <AdminTableSelect
          value={leadStatusValue}
          label="Lọc lead"
          onChange={(value) => table.getColumn("status")?.setFilterValue(value)}
          options={[
            { value: "", label: "Tất cả lead" },
            ...leadStatusOptions.map((status) => ({ value: status, label: status })),
          ]}
        />
        <AdminTableSelect
          value={quoteStatusValue}
          label="Lọc quote"
          onChange={(value) => table.getColumn("quote_status")?.setFilterValue(value)}
          options={[
            { value: "", label: "Tất cả quote" },
            ...quoteStatusOptions.map((status) => ({ value: status, label: status })),
          ]}
        />
        <AdminTableClearButton
          visible={hasFilters}
          onClick={() => {
            setGlobalFilter("");
            table.getColumn("status")?.setFilterValue("");
            table.getColumn("quote_status")?.setFilterValue("");
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
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Không có lead phù hợp với bộ lọc hiện tại.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">{table.getFilteredRowModel().rows.length} lead</p>

      <Dialog open={Boolean(previewLead)} onOpenChange={(open) => !open && setPreviewLeadId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          {previewLead ? (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle>{previewLead.provider}</DialogTitle>
                <DialogDescription>{previewLead.offering || "Yêu cầu chung"}</DialogDescription>
              </DialogHeader>

              <PreviewSection title="Lead">
                <div className="grid gap-3 md:grid-cols-2">
                  <PreviewField label="Customer" value={previewLead.customer || "Guest"} />
                  <PreviewField label="Lead status" value={<StatusBadge value={previewLead.status} />} />
                  <PreviewField label="Budget" value={formatMoney(previewLead.budget)} />
                  <PreviewField label="Event date" value={formatDate(previewLead.event_date)} />
                </div>
              </PreviewSection>

              <PreviewSection title="Quote">
                <div className="grid gap-3 md:grid-cols-2">
                  <PreviewField label="Quote status" value={<StatusBadge value={previewLead.quote_status} tone="quote" />} />
                  <PreviewField label="Quote amount" value={formatMoney(previewLead.quote_amount)} />
                  <PreviewField label="Created" value={formatDateTime(previewLead.created_at)} />
                  <PreviewField label="Updated" value={formatDateTime(previewLead.updated_at)} />
                </div>
              </PreviewSection>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
