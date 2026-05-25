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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminTableActionButton, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import { AdminTableClearButton, AdminTableSearch, AdminTableSelect, AdminTableToolbar, AdminTableSortButton } from "@/features/admin/components/admin-table-controls";
import { AdminTableView } from "@/features/admin/components/admin-table-view";
import { getProviderOfferingReviewStatusLabel, getProviderOfferingSubmissionTypeLabel } from "@/features/provider-offering-submissions/labels";
import { ProviderOfferingStatusBadge } from "@/features/provider-offering-submissions/components/provider-offering-status-badge";
import type { ProviderOfferingReviewStatus, ProviderOfferingSubmission } from "@/features/provider-offering-submissions/types";
import { formatVnd } from "@/lib/currency";
import { ROUTES } from "@/lib/routes";

type ProviderOption = {
  id: string;
  name: string;
};

type AdminProviderOfferingRequestsTableProps = {
  submissions: ProviderOfferingSubmission[];
  providers: ProviderOption[];
};

function formatDate(value?: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

const REVIEW_STATUSES: ProviderOfferingReviewStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "changes_requested",
  "approved",
  "rejected",
  "archived",
];

function getCellClassName(columnId: string) {
  return columnId === "providerId" ? "hidden" : undefined;
}

export function AdminProviderOfferingRequestsTable({
  submissions,
  providers,
}: AdminProviderOfferingRequestsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [previewSubmissionId, setPreviewSubmissionId] = useState<string | null>(null);
  const previewSubmission = previewSubmissionId
    ? submissions.find((submission) => submission.id === previewSubmissionId) ?? null
    : null;

  const columns = useMemo<ColumnDef<ProviderOfferingSubmission>[]>(
    () => [
      {
        accessorKey: "providerDisplayName",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Nhà cung cấp</AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <p>{row.original.providerDisplayName}</p>
            <p className="text-xs text-muted-foreground">{row.original.providerUsername}</p>
          </div>
        ),
      },
      {
        accessorKey: "providerId",
        header: "Provider ID",
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>(columnId) === filterValue;
        },
        cell: () => null,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Sản phẩm</AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <p>{row.original.name}</p>
            <p className="text-xs text-muted-foreground">/{row.original.slugCandidate}</p>
            {row.original.linkedOfferingName ? (
              <p className="text-xs text-muted-foreground">Đang liên kết: {row.original.linkedOfferingName}</p>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "submissionType",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Loại yêu cầu</AdminTableSortButton>
        ),
        cell: ({ row }) => <Badge variant="secondary">{getProviderOfferingSubmissionTypeLabel(row.original.submissionType)}</Badge>,
      },
      {
        accessorKey: "purchaseCost",
        header: ({ column }) => (
          <div className="text-right">
            <AdminTableSortButton align="right" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Giá nhập</AdminTableSortButton>
          </div>
        ),
        cell: ({ row }) => <div className="text-right">{formatVnd(row.original.purchaseCost)}</div>,
      },
      {
        accessorKey: "adminSellPrice",
        header: () => <div className="text-right">Giá bán admin</div>,
        cell: ({ row }) => <div className="text-right">{row.original.adminSellPrice ? formatVnd(row.original.adminSellPrice) : "-"}</div>,
      },
      {
        accessorKey: "proposedStockQuantity",
        header: () => <div className="text-right">Tồn kho</div>,
        cell: ({ row }) => <div className="text-right">{row.original.proposedStockQuantity}</div>,
      },
      {
        accessorKey: "reviewStatus",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Trạng thái</AdminTableSortButton>
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
        cell: ({ row }) => {
          const submission = row.original;

          return (
            <AdminTableActions>
              <AdminTableActionButton action="view" label="Xem hồ sơ" onClick={() => setPreviewSubmissionId(submission.id)} />
              <AdminTableActionButton action="edit" label="Duyệt yêu cầu" href={ROUTES.ADMIN.PROVIDER_OFFERING(submission.id)} />
            </AdminTableActions>
          );
        },
      },
    ],
    []
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
        submission.providerDisplayName,
        submission.providerUsername,
        submission.name,
        submission.slugCandidate,
        submission.linkedOfferingName,
        submission.categoryName,
        submission.reviewStatus,
        submission.submissionType,
        submission.providerSku,
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
  const providerFilterValue = (table.getColumn("providerId")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters = globalFilter.trim().length > 0 || statusFilterValue.length > 0 || providerFilterValue.length > 0;

  return (
    <div className="space-y-4">
      <AdminTableToolbar>
        <AdminTableSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Tìm theo nhà cung cấp, sản phẩm, slug..." />
        <AdminTableSelect
          value={statusFilterValue}
          label="Lọc trạng thái"
          onChange={(value) => table.getColumn("reviewStatus")?.setFilterValue(value)}
          options={[
            { value: "", label: "Tất cả trạng thái" },
            ...REVIEW_STATUSES.map((status) => ({ value: status, label: getProviderOfferingReviewStatusLabel(status) })),
          ]}
        />
        <AdminTableSelect
          value={providerFilterValue}
          label="Lọc provider"
          onChange={(value) => table.getColumn("providerId")?.setFilterValue(value)}
          options={[
            { value: "", label: "Tất cả nhà cung cấp" },
            ...providers.map((provider) => ({ value: provider.id, label: provider.name })),
          ]}
        />
        <AdminTableClearButton
          visible={hasFilters}
          onClick={() => {
            setGlobalFilter("");
            table.getColumn("reviewStatus")?.setFilterValue("");
            table.getColumn("providerId")?.setFilterValue("");
          }}
        />
      </AdminTableToolbar>

      <AdminTableView
        table={table}
        columnCount={columns.length - 1}
        emptyMessage="Không có hồ sơ nào khớp với bộ lọc hiện tại."
        getCellClassName={getCellClassName}
      />

      <Dialog open={Boolean(previewSubmission)} onOpenChange={(open) => !open && setPreviewSubmissionId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {previewSubmission ? (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle>Chi tiết yêu cầu sản phẩm</DialogTitle>
                <DialogDescription>Xem nhanh thông tin trước khi vào màn duyệt.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm">Nhà cung cấp</p>
                  <p className="text-sm text-muted-foreground">{previewSubmission.providerDisplayName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Sản phẩm</p>
                  <p className="text-sm text-muted-foreground">{previewSubmission.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Slug đề xuất</p>
                  <p className="text-sm text-muted-foreground">/{previewSubmission.slugCandidate}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Loại yêu cầu</p>
                  <p className="text-sm text-muted-foreground">{getProviderOfferingSubmissionTypeLabel(previewSubmission.submissionType)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Giá nhập</p>
                  <p className="text-sm text-muted-foreground">{formatVnd(previewSubmission.purchaseCost)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Giá bán admin</p>
                  <p className="text-sm text-muted-foreground">{previewSubmission.adminSellPrice ? formatVnd(previewSubmission.adminSellPrice) : "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Tồn kho</p>
                  <p className="text-sm text-muted-foreground">{previewSubmission.proposedStockQuantity}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Cập nhật</p>
                  <p className="text-sm text-muted-foreground">{formatDate(previewSubmission.updatedAt)}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm">Mô tả ngắn</p>
                <p className="rounded-md border p-3 text-sm text-muted-foreground">{previewSubmission.excerpt || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm">Ghi chú nhà cung cấp</p>
                <p className="rounded-md border p-3 text-sm text-muted-foreground">{previewSubmission.providerNote || "-"}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
