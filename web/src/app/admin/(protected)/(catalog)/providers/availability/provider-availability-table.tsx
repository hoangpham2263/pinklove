"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { AdminTableClearButton, AdminTableSearch, AdminTableSelect, AdminTableSortButton, AdminTableToolbar } from "@/features/admin/components/admin-table-controls";
import { AdminTableView } from "@/features/admin/components/admin-table-view";

export type ProviderAvailabilityRow = {
  id: string;
  provider: string;
  calendar: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  booked_count: number;
  status: string;
};

type ProviderAvailabilityTableProps = {
  rows: ProviderAvailabilityRow[];
};

function formatDateTime(value: string) {
  return new Date(value).toISOString().slice(0, 16).replace("T", " ");
}

export function ProviderAvailabilityTable({ rows }: ProviderAvailabilityTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const statusOptions = useMemo(() => {
    const statuses = Array.from(new Set(rows.map((row) => row.status).filter(Boolean))).sort();
    return [{ value: "", label: "Tất cả trạng thái" }, ...statuses.map((status) => ({ value: status, label: status }))];
  }, [rows]);

  const columns = useMemo<ColumnDef<ProviderAvailabilityRow>[]>(
    () => [
      {
        accessorKey: "provider",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Provider</AdminTableSortButton>
        ),
      },
      {
        accessorKey: "calendar",
        header: "Calendar",
      },
      {
        accessorKey: "starts_at",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Starts</AdminTableSortButton>
        ),
        cell: ({ row }) => formatDateTime(row.original.starts_at),
      },
      {
        accessorKey: "ends_at",
        header: "Ends",
        cell: ({ row }) => formatDateTime(row.original.ends_at),
      },
      {
        accessorKey: "capacity",
        header: () => <div className="text-right">Capacity</div>,
        cell: ({ row }) => <div className="text-right">{row.original.capacity}</div>,
      },
      {
        accessorKey: "booked_count",
        header: () => <div className="text-right">Booked</div>,
        cell: ({ row }) => <div className="text-right">{row.original.booked_count}</div>,
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Status</AdminTableSortButton>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>(columnId) === filterValue;
        },
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
      const item = row.original;
      return [item.provider, item.calendar, item.status, item.starts_at, item.ends_at].some((value) =>
        String(value ?? "").toLowerCase().includes(keyword)
      );
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
      <h2 className="text-xl font-semibold tracking-tight">Time slots</h2>
      <AdminTableToolbar>
        <AdminTableSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Tìm provider, calendar, thời gian..." />
        <AdminTableSelect value={statusFilterValue} label="Lọc trạng thái" onChange={(value) => table.getColumn("status")?.setFilterValue(value)} options={statusOptions} />
        <AdminTableClearButton
          visible={hasFilters}
          onClick={() => {
            setGlobalFilter("");
            table.getColumn("status")?.setFilterValue("");
          }}
        />
      </AdminTableToolbar>
      <AdminTableView table={table} columnCount={columns.length} emptyMessage="Không có time slot phù hợp với bộ lọc hiện tại." />
    </div>
  );
}
