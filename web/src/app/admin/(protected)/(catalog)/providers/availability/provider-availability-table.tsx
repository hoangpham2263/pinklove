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
import {
  getProviderAvailabilityKindClassName,
  getProviderAvailabilityKindLabel,
} from "@/features/providers/config/availability";
import { cn } from "@/lib/utils";

export type ProviderAvailabilityRow = {
  id: string;
  provider_id: string;
  provider: string;
  provider_type: string;
  calendar: string | null;
  provider_service_id: string | null;
  offering_id: string | null;
  offering_name: string | null;
  service_title: string | null;
  fulfillment_type: string | null;
  service_kind: string | null;
  availability_kind: string;
  day_of_week: number | null;
  starts_at: string | null;
  ends_at: string | null;
  valid_from: string | null;
  valid_until: string | null;
  capacity: number;
  status: string;
  updated_at: string;
};

type ProviderAvailabilityTableProps = {
  rows: ProviderAvailabilityRow[];
};

const DAY_LABELS: Record<number, string> = {
  0: "Chủ nhật",
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
};

const STATUS_LABELS: Record<string, string> = {
  available: "Có thể nhận",
  unavailable: "Không nhận",
  blocked: "Đã chặn",
};

const STATUS_CLASSES: Record<string, string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-700",
  unavailable: "border-slate-200 bg-slate-50 text-slate-700",
  blocked: "border-rose-200 bg-rose-50 text-rose-700",
};

function formatTime(value: string | null) {
  if (!value) return "-";
  return value.slice(0, 5);
}

function formatDate(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function getDayLabel(day: number | null) {
  if (day === null) return "Hằng ngày";
  return DAY_LABELS[day] ?? `Ngày ${day}`;
}

function getServiceLabel(row: ProviderAvailabilityRow) {
  return row.service_title || row.offering_name || "Không gắn dịch vụ";
}

function getDateInputDay(value: string) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return String(date.getDay());
}

function isRuleActiveOnDate(row: ProviderAvailabilityRow, dateValue: string) {
  if (!dateValue) return true;
  const dayValue = getDateInputDay(dateValue);
  if (dayValue && row.day_of_week !== null && String(row.day_of_week) !== dayValue) return false;
  const validFrom = formatDate(row.valid_from);
  const validUntil = formatDate(row.valid_until);
  if (validFrom && validFrom > dateValue) return false;
  if (validUntil && validUntil < dateValue) return false;
  return true;
}

function isRuleOverlappingTime(row: ProviderAvailabilityRow, fromTime: string, toTime: string) {
  const startsAt = formatTime(row.starts_at);
  const endsAt = formatTime(row.ends_at);
  if (startsAt === "-" || endsAt === "-") return true;
  if (fromTime && endsAt <= fromTime) return false;
  if (toTime && startsAt >= toTime) return false;
  return true;
}

export function ProviderAvailabilityTable({ rows }: ProviderAvailabilityTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [checkDate, setCheckDate] = useState("");
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");

  const statusOptions = useMemo(() => {
    const statuses = Array.from(new Set(rows.map((row) => row.status).filter(Boolean))).sort();
    return [{ value: "", label: "Tất cả trạng thái" }, ...statuses.map((status) => ({ value: status, label: STATUS_LABELS[status] ?? status }))];
  }, [rows]);

  const providerOptions = useMemo(() => {
    const providers = Array.from(new Set(rows.map((row) => row.provider).filter(Boolean))).sort();
    return [{ value: "", label: "Tất cả provider" }, ...providers.map((provider) => ({ value: provider, label: provider }))];
  }, [rows]);

  const serviceOptions = useMemo(() => {
    const services = Array.from(new Set(rows.map((row) => getServiceLabel(row)).filter(Boolean))).sort();
    return [{ value: "", label: "Tất cả dịch vụ" }, ...services.map((service) => ({ value: service, label: service }))];
  }, [rows]);

  const kindOptions = useMemo(() => {
    const kinds = Array.from(new Set(rows.map((row) => row.availability_kind).filter(Boolean))).sort();
    return [{ value: "", label: "Tất cả mục đích" }, ...kinds.map((kind) => ({ value: kind, label: getProviderAvailabilityKindLabel(kind) }))];
  }, [rows]);

  const filteredRows = useMemo(
    () => rows.filter((row) => isRuleActiveOnDate(row, checkDate) && isRuleOverlappingTime(row, fromTime, toTime)),
    [checkDate, fromTime, rows, toTime]
  );

  const columns = useMemo<ColumnDef<ProviderAvailabilityRow>[]>(
    () => [
      {
        accessorKey: "provider",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Provider</AdminTableSortButton>
        ),
      },
      {
        accessorKey: "provider_type",
        header: "Loại",
        cell: ({ row }) => <span className="capitalize">{row.original.provider_type}</span>,
      },
      {
        accessorKey: "calendar",
        header: "Lịch",
        cell: ({ row }) => row.original.calendar ?? "Mặc định",
      },
      {
        id: "service",
        accessorFn: (row) => getServiceLabel(row),
        header: "Dịch vụ",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{getServiceLabel(row.original)}</div>
            <div className="text-xs text-muted-foreground">{row.original.fulfillment_type || row.original.service_kind || "general"}</div>
          </div>
        ),
        filterFn: (row, _columnId, filterValue) => {
          if (!filterValue) return true;
          return getServiceLabel(row.original) === filterValue;
        },
      },
      {
        accessorKey: "availability_kind",
        header: "Mục đích",
        cell: ({ row }) => (
          <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1", getProviderAvailabilityKindClassName(row.original.availability_kind))}>
            {getProviderAvailabilityKindLabel(row.original.availability_kind)}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>(columnId) === filterValue;
        },
      },
      {
        accessorKey: "day_of_week",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Ngày</AdminTableSortButton>
        ),
        cell: ({ row }) => getDayLabel(row.original.day_of_week),
      },
      {
        accessorKey: "starts_at",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Khung giờ</AdminTableSortButton>
        ),
        cell: ({ row }) => `${formatTime(row.original.starts_at)} - ${formatTime(row.original.ends_at)}`,
      },
      {
        id: "valid_range",
        header: "Hiệu lực",
        cell: ({ row }) => {
          const from = formatDate(row.original.valid_from);
          const until = formatDate(row.original.valid_until);
          if (!from && !until) return "Luôn áp dụng";
          return `${from || "..."} -> ${until || "..."}`;
        },
      },
      {
        accessorKey: "capacity",
        header: () => <div className="text-right">Capacity</div>,
        cell: ({ row }) => <div className="text-right">{row.original.capacity}</div>,
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Status</AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-medium", STATUS_CLASSES[row.original.status] ?? "border-border bg-muted text-muted-foreground")}>
            {STATUS_LABELS[row.original.status] ?? row.original.status}
          </span>
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
    data: filteredRows,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const keyword = String(filterValue).trim().toLowerCase();
      if (!keyword) return true;
      const item = row.original;
      return [
        item.provider,
        item.provider_type,
        item.calendar,
        item.status,
        getServiceLabel(item),
        item.fulfillment_type,
        item.service_kind,
        getProviderAvailabilityKindLabel(item.availability_kind),
        getDayLabel(item.day_of_week),
        item.starts_at,
        item.ends_at,
      ].some((value) => String(value ?? "").toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const providerFilterValue = (table.getColumn("provider")?.getFilterValue() as string | undefined) ?? "";
  const serviceFilterValue = (table.getColumn("service")?.getFilterValue() as string | undefined) ?? "";
  const kindFilterValue = (table.getColumn("availability_kind")?.getFilterValue() as string | undefined) ?? "";
  const statusFilterValue = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters = globalFilter.trim().length > 0 || providerFilterValue.length > 0 || serviceFilterValue.length > 0 || kindFilterValue.length > 0 || statusFilterValue.length > 0 || checkDate.length > 0 || fromTime.length > 0 || toTime.length > 0;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Lịch đã khai báo</h2>
      <AdminTableToolbar contentClassName="w-full">
        <AdminTableSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Tìm provider, lịch, thứ, giờ..." />
        <AdminTableSelect value={providerFilterValue} label="Lọc provider" onChange={(value) => table.getColumn("provider")?.setFilterValue(value)} options={providerOptions} />
        <AdminTableSelect value={serviceFilterValue} label="Lọc dịch vụ" onChange={(value) => table.getColumn("service")?.setFilterValue(value)} options={serviceOptions} />
        <AdminTableSelect value={kindFilterValue} label="Lọc mục đích" onChange={(value) => table.getColumn("availability_kind")?.setFilterValue(value)} options={kindOptions} />
        <AdminTableSelect value={statusFilterValue} label="Lọc trạng thái" onChange={(value) => table.getColumn("status")?.setFilterValue(value)} options={statusOptions} />
        <input
          type="date"
          value={checkDate}
          aria-label="Ngày kiểm tra"
          onChange={(event) => setCheckDate(event.target.value)}
          className="h-9 w-full rounded-lg border border-input bg-white px-3 text-sm transition-colors md:w-44"
        />
        <input
          type="time"
          value={fromTime}
          aria-label="Từ giờ"
          onChange={(event) => setFromTime(event.target.value)}
          className="h-9 w-full rounded-lg border border-input bg-white px-3 text-sm transition-colors md:w-32"
        />
        <input
          type="time"
          value={toTime}
          aria-label="Đến giờ"
          onChange={(event) => setToTime(event.target.value)}
          className="h-9 w-full rounded-lg border border-input bg-white px-3 text-sm transition-colors md:w-32"
        />
        <AdminTableClearButton
          visible={hasFilters}
          onClick={() => {
            setGlobalFilter("");
            table.getColumn("provider")?.setFilterValue("");
            table.getColumn("service")?.setFilterValue("");
            table.getColumn("availability_kind")?.setFilterValue("");
            table.getColumn("status")?.setFilterValue("");
            setCheckDate("");
            setFromTime("");
            setToTime("");
          }}
        />
      </AdminTableToolbar>
      <AdminTableView table={table} columnCount={columns.length} emptyMessage="Không có lịch provider phù hợp với bộ lọc hiện tại." />
    </div>
  );
}
