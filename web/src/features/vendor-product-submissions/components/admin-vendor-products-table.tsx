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

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminTableActionButton, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import { AdminTableClearButton, AdminTableSearch, AdminTableSelect, AdminTableToolbar, AdminTableSortButton } from "@/features/admin/components/admin-table-controls";
import { getVendorProductSubmissionTypeLabel } from "@/features/vendor-product-submissions/labels";
import { VendorProductStatusBadge } from "@/features/vendor-product-submissions/components/vendor-product-status-badge";
import type { VendorProductReviewStatus, VendorProductSubmission } from "@/features/vendor-product-submissions/types";
import { ROUTES } from "@/lib/routes";

type VendorOption = {
  id: string;
  name: string;
};

type AdminVendorProductsTableProps = {
  submissions: VendorProductSubmission[];
  vendors: VendorOption[];
};

function formatDate(value?: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

const REVIEW_STATUSES: VendorProductReviewStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "changes_requested",
  "approved",
  "rejected",
  "archived",
];

export function AdminVendorProductsTable({ submissions, vendors }: AdminVendorProductsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [previewSubmissionId, setPreviewSubmissionId] = useState<string | null>(null);
  const previewSubmission = previewSubmissionId
    ? submissions.find((submission) => submission.id === previewSubmissionId) ?? null
    : null;

  const columns = useMemo<ColumnDef<VendorProductSubmission>[]>(
    () => [
      {
        accessorKey: "vendorDisplayName",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Vendor</AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <p>{row.original.vendorDisplayName}</p>
            <p className="text-xs text-muted-foreground">{row.original.vendorUsername}</p>
          </div>
        ),
      },
      {
        accessorKey: "vendorUserId",
        header: "Vendor ID",
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
            {row.original.linkedProductName ? (
              <p className="text-xs text-muted-foreground">Live: {row.original.linkedProductName}</p>
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
        cell: ({ row }) => <Badge variant="secondary">{getVendorProductSubmissionTypeLabel(row.original.submissionType)}</Badge>,
      },
      {
        accessorKey: "purchaseCost",
        header: ({ column }) => (
          <div className="text-right">
            <AdminTableSortButton align="right" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Giá nhập</AdminTableSortButton>
          </div>
        ),
        cell: ({ row }) => <div className="text-right">{row.original.purchaseCost}</div>,
      },
      {
        accessorKey: "adminSellPrice",
        header: () => <div className="text-right">Giá bán admin</div>,
        cell: ({ row }) => <div className="text-right">{row.original.adminSellPrice ?? "-"}</div>,
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
        cell: ({ row }) => <VendorProductStatusBadge status={row.original.reviewStatus} />,
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
              <AdminTableActionButton action="edit" label="Review" href={ROUTES.ADMIN.VENDOR_PRODUCT(submission.id)} />
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
        submission.vendorDisplayName,
        submission.vendorUsername,
        submission.name,
        submission.slugCandidate,
        submission.linkedProductName,
        submission.categoryName,
        submission.reviewStatus,
        submission.submissionType,
        submission.vendorSku,
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
  const vendorFilterValue = (table.getColumn("vendorUserId")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters = globalFilter.trim().length > 0 || statusFilterValue.length > 0 || vendorFilterValue.length > 0;

  return (
    <div className="space-y-4">
      <AdminTableToolbar>
        <AdminTableSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Tìm theo vendor, sản phẩm, slug..." />
        <AdminTableSelect
          value={statusFilterValue}
          label="Lọc trạng thái"
          onChange={(value) => table.getColumn("reviewStatus")?.setFilterValue(value)}
          options={[
            { value: "", label: "Tất cả trạng thái" },
            ...REVIEW_STATUSES.map((status) => ({ value: status, label: status })),
          ]}
        />
        <AdminTableSelect
          value={vendorFilterValue}
          label="Lọc vendor"
          onChange={(value) => table.getColumn("vendorUserId")?.setFilterValue(value)}
          options={[
            { value: "", label: "Tất cả vendor" },
            ...vendors.map((vendor) => ({ value: vendor.id, label: vendor.name })),
          ]}
        />
        <AdminTableClearButton
          visible={hasFilters}
          onClick={() => {
            setGlobalFilter("");
            table.getColumn("reviewStatus")?.setFilterValue("");
            table.getColumn("vendorUserId")?.setFilterValue("");
          }}
        />
      </AdminTableToolbar>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={header.column.id === "vendorUserId" ? "hidden font-medium" : "font-medium"}>
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
                    <TableCell key={cell.id} className={cell.column.id === "vendorUserId" ? "hidden" : undefined}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length - 1} className="h-24 text-center">
                  Không có hồ sơ nào khớp với bộ lọc hiện tại.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(previewSubmission)} onOpenChange={(open) => !open && setPreviewSubmissionId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {previewSubmission ? (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle>Chi tiết hồ sơ vendor</DialogTitle>
                <DialogDescription>Xem nhanh thông tin proposal trước khi vào màn review.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm">Vendor</p>
                  <p className="text-sm text-muted-foreground">{previewSubmission.vendorDisplayName}</p>
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
                  <p className="text-sm text-muted-foreground">{getVendorProductSubmissionTypeLabel(previewSubmission.submissionType)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Giá nhập</p>
                  <p className="text-sm text-muted-foreground">{previewSubmission.purchaseCost}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Giá bán admin</p>
                  <p className="text-sm text-muted-foreground">{previewSubmission.adminSellPrice ?? "-"}</p>
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
                <p className="text-sm">Ghi chú vendor</p>
                <p className="rounded-md border p-3 text-sm text-muted-foreground">{previewSubmission.vendorNote || "-"}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
