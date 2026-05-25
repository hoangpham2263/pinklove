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

import { Badge } from "@/components/ui/badge";
import { ProviderOfferingStatusBadge } from "@/features/provider-offering-submissions/components/provider-offering-status-badge";
import {
  getProviderOfferingReviewStatusLabel,
  getProviderOfferingSubmissionTypeLabel,
} from "@/features/provider-offering-submissions/labels";
import type {
  ProviderOfferingReviewStatus,
  ProviderOfferingSubmission,
} from "@/features/provider-offering-submissions/types";
import { ProviderTableActionButton, ProviderTableActions } from "@/features/provider-orders/components/provider-table-actions";
import {
  ProviderTableClearButton,
  ProviderTableSearch,
  ProviderTableSelect,
  ProviderTableSortButton,
  ProviderTableToolbar,
} from "@/features/provider-orders/components/provider-table-controls";
import { ProviderTableView } from "@/features/provider-orders/components/provider-table-view";
import { formatVnd } from "@/lib/currency";
import { ROUTES } from "@/lib/routes";

type ProviderOfferingRequestsTableProps = {
  submissions: ProviderOfferingSubmission[];
};

const REVIEW_STATUSES: ProviderOfferingReviewStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "changes_requested",
  "approved",
  "rejected",
  "archived",
];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

function getCellClassName(columnId: string) {
  switch (columnId) {
    case "submissionType":
      return "hidden lg:table-cell";
    case "purchaseCost":
    case "proposedStockQuantity":
    case "updatedAt":
      return "hidden xl:table-cell";
    case "reviewStatus":
      return "hidden md:table-cell";
    case "actions":
      return "w-[72px] text-right";
    default:
      return undefined;
  }
}

export function ProviderOfferingRequestsTable({ submissions }: ProviderOfferingRequestsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<ProviderOfferingSubmission>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <ProviderTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Sản phẩm
          </ProviderTableSortButton>
        ),
        cell: ({ row }) => (
          <div className="min-w-0 space-y-1">
            <p className="truncate font-medium">{row.original.name}</p>
            {row.original.linkedOfferingName ? (
              <p className="truncate text-xs text-muted-foreground">Đang liên kết: {row.original.linkedOfferingName}</p>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "submissionType",
        header: ({ column }) => (
          <ProviderTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Loại
          </ProviderTableSortButton>
        ),
        cell: ({ row }) => <Badge variant="secondary">{getProviderOfferingSubmissionTypeLabel(row.original.submissionType)}</Badge>,
      },
      {
        accessorKey: "purchaseCost",
        header: ({ column }) => (
          <div className="text-right">
            <ProviderTableSortButton align="right" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Giá nhập
            </ProviderTableSortButton>
          </div>
        ),
        cell: ({ row }) => <div className="text-right text-muted-foreground">{formatVnd(row.original.purchaseCost)}</div>,
      },
      {
        accessorKey: "proposedStockQuantity",
        header: ({ column }) => (
          <div className="text-right">
            <ProviderTableSortButton align="right" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Số lượng
            </ProviderTableSortButton>
          </div>
        ),
        cell: ({ row }) => <div className="text-right text-muted-foreground">{row.original.proposedStockQuantity}</div>,
      },
      {
        accessorKey: "reviewStatus",
        header: ({ column }) => (
          <ProviderTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Trạng thái
          </ProviderTableSortButton>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>(columnId) === filterValue;
        },
        cell: ({ row }) => <ProviderOfferingStatusBadge status={row.original.reviewStatus} />,
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <ProviderTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Cập nhật
          </ProviderTableSortButton>
        ),
        cell: ({ row }) => <span className="text-muted-foreground">{formatDateTime(row.original.updatedAt)}</span>,
      },
      {
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <div className="text-right">Thao tác</div>,
        cell: ({ row }) => (
          <ProviderTableActions>
            <ProviderTableActionButton action="view" label="Mở hồ sơ" href={ROUTES.PROVIDER.OFFERING(row.original.id)} />
          </ProviderTableActions>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: submissions,
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

      const submission = row.original;
      return [
        submission.name,
        submission.slugCandidate,
        submission.linkedOfferingName,
        submission.categoryName,
        submission.providerSku,
        submission.submissionType,
        submission.reviewStatus,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const statusFilterValue = (table.getColumn("reviewStatus")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters = globalFilter.trim().length > 0 || statusFilterValue.length > 0;

  return (
    <div className="space-y-4">
      <ProviderTableToolbar>
        <ProviderTableSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Tìm theo sản phẩm, slug, SKU..." />
        <ProviderTableSelect
          value={statusFilterValue}
          label="Lọc trạng thái"
          onChange={(value) => table.getColumn("reviewStatus")?.setFilterValue(value)}
          options={[
            { value: "", label: "Tất cả trạng thái" },
            ...REVIEW_STATUSES.map((status) => ({ value: status, label: getProviderOfferingReviewStatusLabel(status) })),
          ]}
        />
        <ProviderTableClearButton
          visible={hasFilters}
          onClick={() => {
            setGlobalFilter("");
            table.getColumn("reviewStatus")?.setFilterValue("");
          }}
        />
      </ProviderTableToolbar>

      <ProviderTableView
        table={table}
        columnCount={columns.length}
        emptyMessage="Không có hồ sơ nào khớp với bộ lọc hiện tại."
        getCellClassName={getCellClassName}
      />
    </div>
  );
}
