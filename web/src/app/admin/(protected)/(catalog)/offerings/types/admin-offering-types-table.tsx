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
import { AdminCreateLinkButton, AdminLinkButton } from "@/features/admin/components/admin-buttons";
import { AdminTableActionButton, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import { AdminTableClearButton, AdminTableSearch, AdminTableSelect, AdminTableToolbar, AdminTableSortButton } from "@/features/admin/components/admin-table-controls";
import {
  SYSTEM_OFFERING_TYPES,
  type OfferingFulfillmentType,
  type OfferingTypeDefinition,
} from "@/features/offerings/types";
import { ROUTES } from "@/lib/routes";

type AdminOfferingTypesTableProps = {
  offeringTypes: OfferingTypeDefinition[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getFulfillmentTypeLabel(value: OfferingFulfillmentType) {
  switch (value) {
    case "digital":
      return "Sản phẩm online - Nhận qua link/file";
    case "physical":
      return "Sản phẩm vật lý - Có sản xuất/giao hàng";
    case "service":
      return "Dịch vụ - Có người thực hiện/đặt lịch";
    default:
      return value;
  }
}

function getOfferingTypeStatusLabel(status: OfferingTypeDefinition["status"]) {
  switch (status) {
    case "active":
      return "Active";
    case "archived":
      return "Archived";
    case "draft":
    default:
      return "Draft";
  }
}

export function AdminOfferingTypesTable({ offeringTypes }: AdminOfferingTypesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [previewTypeId, setPreviewTypeId] = useState<string | null>(null);

  const previewType = offeringTypes.find((type) => type.id === previewTypeId) ?? null;

  const columns = useMemo<ColumnDef<OfferingTypeDefinition>[]>(
    () => [
      {
        accessorKey: "label",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Type
          </AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.label}</div>
            <div className="font-mono text-xs text-muted-foreground">{row.original.key}</div>
          </div>
        ),
      },
      {
        accessorKey: "fulfillmentType",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Fulfillment
          </AdminTableSortButton>
        ),
        cell: ({ row }) => getFulfillmentTypeLabel(row.original.fulfillmentType),
        filterFn: (row, columnId, filterValue) => !filterValue || row.getValue<string>(columnId) === filterValue,
      },
      {
        accessorKey: "fieldSchema",
        header: "Fields",
        cell: ({ row }) => row.original.fieldSchema.length,
      },
      {
        accessorKey: "supportsInventory",
        header: "Inventory",
        cell: ({ row }) => (row.original.supportsInventory ? "Yes" : "No"),
      },
      {
        accessorKey: "supportsProviderSupply",
        header: "Provider",
        cell: ({ row }) => (row.original.supportsProviderSupply ? "Yes" : "No"),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Trạng thái
          </AdminTableSortButton>
        ),
        filterFn: (row, columnId, filterValue) => !filterValue || row.getValue<string>(columnId) === filterValue,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Badge variant={row.original.status === "active" ? "default" : "secondary"}>{getOfferingTypeStatusLabel(row.original.status)}</Badge>
            {row.original.isSystem ? <span className="rounded border px-1.5 py-0.5 text-xs text-muted-foreground">system</span> : null}
          </div>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Cập nhật
          </AdminTableSortButton>
        ),
        cell: ({ row }) => formatDate(row.original.updatedAt),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => {
          const type = row.original;
          return (
            <AdminTableActions>
              <AdminTableActionButton action="view" label="Xem type" onClick={() => setPreviewTypeId(type.id)} />
              <AdminTableActionButton
                action="edit"
                label="Sửa type"
                href={`${ROUTES.ADMIN.OFFERING_TYPE(type.key)}?returnTo=${encodeURIComponent(ROUTES.ADMIN.OFFERING_TYPES)}`}
              />
              <AdminTableActionButton
                action="external"
                label="Tạo offering"
                href={
                  type.key === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE
                    ? ROUTES.ADMIN.OFFERING_BUILDER
                    : `${ROUTES.ADMIN.OFFERINGS}?type=${encodeURIComponent(type.key)}`
                }
              />
            </AdminTableActions>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: offeringTypes,
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
      const type = row.original;
      return [type.key, type.label, type.description, type.fulfillmentType, type.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const statusFilterValue = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "";
  const fulfillmentFilterValue = (table.getColumn("fulfillmentType")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters = globalFilter.trim().length > 0 || statusFilterValue.length > 0 || fulfillmentFilterValue.length > 0;
  const listReturnTo = encodeURIComponent(ROUTES.ADMIN.OFFERING_TYPES);

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <AdminTableToolbar>
            <AdminTableSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Tìm type, key, fulfillment..." />
            <AdminTableSelect
              value={statusFilterValue}
              label="Lọc trạng thái"
              onChange={(value) => table.getColumn("status")?.setFilterValue(value)}
              options={[
                { value: "", label: "Tất cả trạng thái" },
                { value: "active", label: "Active" },
                { value: "draft", label: "Draft" },
                { value: "archived", label: "Archived" },
              ]}
            />
            <AdminTableSelect
              value={fulfillmentFilterValue}
              label="Lọc fulfillment"
              onChange={(value) => table.getColumn("fulfillmentType")?.setFilterValue(value)}
              options={[
                { value: "", label: "Tất cả fulfillment" },
                { value: "digital", label: "Sản phẩm online - Nhận qua link/file" },
                { value: "physical", label: "Sản phẩm vật lý - Có sản xuất/giao hàng" },
                { value: "service", label: "Dịch vụ - Có người thực hiện/đặt lịch" },
              ]}
            />
            <AdminTableClearButton
              visible={hasFilters}
              onClick={() => {
                setGlobalFilter("");
                table.getColumn("status")?.setFilterValue("");
                table.getColumn("fulfillmentType")?.setFilterValue("");
              }}
            />
          </AdminTableToolbar>

          <AdminCreateLinkButton href={`${ROUTES.ADMIN.OFFERING_TYPE_NEW}?returnTo=${listReturnTo}`}>Tạo type</AdminCreateLinkButton>
        </div>

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
                    Không có offering type phù hợp.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={Boolean(previewType)} onOpenChange={(open) => !open && setPreviewTypeId(null)}>
        {previewType ? (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{previewType.label}</DialogTitle>
              <DialogDescription>{previewType.key}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-3">
              <PreviewField label="Fulfillment" value={getFulfillmentTypeLabel(previewType.fulfillmentType)} />
              <PreviewField label="Trạng thái" value={getOfferingTypeStatusLabel(previewType.status)} />
              <PreviewField label="Fields" value={previewType.fieldSchema.length} />
              <PreviewField label="Template key" value={previewType.templateKey} />
              <PreviewField label="Inventory" value={previewType.supportsInventory ? "Yes" : "No"} />
              <PreviewField label="Provider supply" value={previewType.supportsProviderSupply ? "Yes" : "No"} />
            </div>
            <div className="rounded-md border p-3 text-sm text-muted-foreground">
              {previewType.description || "Không có mô tả."}
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewType.fieldSchema.length ? (
                    previewType.fieldSchema.map((field) => (
                      <TableRow key={field.key}>
                        <TableCell className="font-mono text-xs">{field.key}</TableCell>
                        <TableCell>{field.label}</TableCell>
                        <TableCell>{field.type}</TableCell>
                        <TableCell>{field.required ? "Yes" : "No"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                        Chưa có field.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end">
              <AdminLinkButton href={`${ROUTES.ADMIN.OFFERING_TYPE(previewType.key)}?returnTo=${listReturnTo}`}>Chỉnh sửa</AdminLinkButton>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}

function PreviewField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <div className="min-h-9 rounded-md bg-muted/40 px-3 py-2 text-sm">{value || "—"}</div>
    </div>
  );
}
