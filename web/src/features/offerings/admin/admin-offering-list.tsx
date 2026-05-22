"use client";

import { type ReactNode, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { NativeForm } from "@/components/common/native-form";
import { Badge } from "@/components/ui/badge";
import { AdminBulkSubmitButton } from "@/features/admin/components/admin-buttons";
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
import { AdminTableClearButton, AdminTableSearch, AdminTableSelect, AdminTableToolbar, AdminTableSortButton } from "@/features/admin/components/admin-table-controls";
import { AdminTableThumbnail } from "@/features/admin/components/admin-table-thumbnail";
import { ROUTES } from "@/lib/routes";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { getOfferingTypeLabel, type Offering, type OfferingType } from "@/features/offerings/types";
import { getOfferingPath } from "@/lib/public-paths";

function formatDateTime(value: string) {
  return new Date(value).toISOString().slice(0, 16).replace("T", " ");
}

function getFulfillmentTypeLabel(fulfillmentType: Offering["fulfillmentType"]) {
  switch (fulfillmentType) {
    case "physical":
      return "Sản phẩm vật lý";
    case "service":
      return "Dịch vụ";
    default:
      return "Digital";
  }
}

function PreviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-md border p-4">
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </section>
  );
}

function PreviewField({
  label,
  value,
  className = "",
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <div className="min-h-9 rounded-md bg-muted/40 px-3 py-2 text-sm text-foreground">{value || "—"}</div>
    </div>
  );
}

type AdminOfferingListProps = {
  offerings: Offering[];
  search: string;
  status: "" | Offering["status"];
  offeringType: "" | OfferingType;
  title?: string;
  returnTo?: string;
};

export function AdminOfferingList({
  offerings,
  search,
  status,
  offeringType,
  title,
  returnTo = ROUTES.ADMIN.OFFERING_LIST,
}: AdminOfferingListProps) {
  const router = useRouter();
  const canBulkDelete = offeringType !== "digital_template";
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    ...(status ? [{ id: "status", value: status }] : []),
  ]);
  const [globalFilter, setGlobalFilter] = useState(search);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkAction, setBulkAction] = useState("");
  const [previewOfferingId, setPreviewOfferingId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<Offering>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        enableColumnFilter: false,
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label="Select all"
            className="h-4 w-4 rounded border border-input"
            checked={table.getIsAllPageRowsSelected()}
            ref={(element) => {
              if (element) {
                element.indeterminate = table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected();
              }
            }}
            onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select ${row.original.name}`}
            className="h-4 w-4 rounded border border-input"
            checked={row.getIsSelected()}
            onChange={(event) => row.toggleSelected(event.target.checked)}
          />
        ),
      },
      {
        id: "thumbnail",
        enableSorting: false,
        enableColumnFilter: false,
        header: "Ảnh",
        cell: ({ row }) => <AdminTableThumbnail src={row.original.thumbnailUrl} alt={row.original.name} />,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Tên sản phẩm</AdminTableSortButton>
        ),
        cell: ({ row }) => <span>{row.original.name}</span>,
      },
      {
        accessorKey: "categoryName",
        header: "Danh mục",
        cell: ({ row }) => row.original.categoryName || <span className="text-muted-foreground">—</span>,
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Trạng thái</AdminTableSortButton>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>(columnId) === filterValue;
        },
        cell: ({ row }) => (
          <Badge variant={row.original.status === "published" ? "default" : "secondary"}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "offeringType",
        header: "Loại",
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>(columnId) === filterValue;
        },
      },
      {
        accessorKey: "price",
        header: ({ column }) => (
          <div className="text-right">
            <AdminTableSortButton align="right" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Giá</AdminTableSortButton>
          </div>
        ),
        cell: ({ row }) => <div className="text-right">{row.original.price}</div>,
      },
      {
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => {
          const offering = row.original;
          const isBuilderTemplate = offering.offeringType === "digital_template" && offering.templateEngine === "builder";
          const isCodedTemplate = offering.offeringType === "digital_template" && offering.templateEngine === "coded";
          const canDeleteOffering = !isCodedTemplate;
          const publicHref = getOfferingPath(offering);
          const adminEditHref =
            isBuilderTemplate
              ? `${ROUTES.ADMIN.OFFERING_BUILDER_EDITOR(offering.slug)}?returnTo=${encodeURIComponent(returnTo)}`
              : isCodedTemplate
                ? `${ROUTES.ADMIN.OFFERING_TEMPLATE(offering.slug)}?returnTo=${encodeURIComponent(returnTo)}`
              : `${ROUTES.ADMIN.OFFERING(offering.slug)}?returnTo=${encodeURIComponent(returnTo)}`;

          return (
            <AdminTableActions>
              <AdminTableActionButton action="view" label="Xem sản phẩm" onClick={() => setPreviewOfferingId(offering.id)} />
              <AdminTableActionButton action="external" label="Xem ngoài site" href={publicHref} target="_blank" />
              <AdminTableActionButton action="edit" label="Chỉnh sửa" href={adminEditHref} />
              {canDeleteOffering ? (
                <NativeForm
                  action={adminApiActions.deleteOffering}
                  method="POST"
                  className="inline-block"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm: ${offering.name}?`)) {
                      return;
                    }

                    try {
                      const result = await adminApi.deleteOffering(new FormData(event.currentTarget));
                      toast.success(result.message ?? "Đã xóa sản phẩm.");
                      finishMutation(router, result, { redirect: false });
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Không thể xóa sản phẩm.");
                    }
                  }}
                >
                  <input type="hidden" name="slug" value={offering.slug} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <AdminTableActionButton action="delete" label="Xóa sản phẩm" type="submit" />
                </NativeForm>
              ) : null}
            </AdminTableActions>
          );
        },
      },
    ],
    [router, returnTo]
  );

  const table = useReactTable({
    data: offerings,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
      columnVisibility: {
        offeringType: false,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: (row, _columnId, filterValue) => {
      const keyword = String(filterValue).trim().toLowerCase();
      if (!keyword) return true;

      const offering = row.original;
      return [
        offering.name,
        offering.slug,
        offering.templateKey,
        offering.status,
        offering.offeringType,
        offering.excerpt,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: true,
  });

  const statusFilterValue = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters = globalFilter.trim().length > 0 || statusFilterValue.length > 0;
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const previewOffering = previewOfferingId ? offerings.find((offering) => offering.id === previewOfferingId) ?? null : null;

  return (
    <div className="space-y-4">
      {title ? <h2 className="text-xl font-semibold tracking-tight">{title}</h2> : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <AdminTableToolbar>
          <AdminTableSearch
            value={globalFilter}
            onChange={setGlobalFilter}
            placeholder="Tìm theo tên, slug, template key..."
          />
          <AdminTableSelect
            value={statusFilterValue}
            label="Lọc trạng thái"
            onChange={(value) => table.getColumn("status")?.setFilterValue(value)}
            options={[
              { value: "", label: "Tất cả trạng thái" },
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
            ]}
          />
          <AdminTableClearButton
            visible={hasFilters}
            onClick={() => {
              setGlobalFilter("");
              table.getColumn("status")?.setFilterValue("");
            }}
          />
        </AdminTableToolbar>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <NativeForm
            action={adminApiActions.bulkUpdateOfferings}
            method="POST"
            className="flex flex-col gap-3 md:flex-row md:items-center"
            onSubmit={async (event) => {
              if (!bulkAction || selectedCount === 0) {
                event.preventDefault();
                return;
              }

              event.preventDefault();

              if (bulkAction === "delete" && !confirm(`Xóa ${selectedCount} sản phẩm đã chọn?`)) {
                return;
              }

              try {
                const result = await adminApi.bulkUpdateOfferings(new FormData(event.currentTarget));
                toast.success(result.message ?? "Đã áp dụng tác vụ hàng loạt.");
                finishMutation(router, result, { redirect: false });
                setRowSelection({});
                setBulkAction("");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Không thể áp dụng tác vụ hàng loạt.");
              }
            }}
          >
            {selectedRows.map((row) => (
              <input key={row.id} type="hidden" name="slugs" value={row.original.slug} />
            ))}
            <input type="hidden" name="returnTo" value={returnTo} />
            <select
              name="bulkAction"
              value={bulkAction}
              onChange={(event) => setBulkAction(event.target.value)}
              className="h-9 min-w-52 rounded-lg border border-input bg-background px-3 text-sm outline-none"
            >
              <option value="">Tác vụ hàng loạt</option>
              <option value="publish">Published</option>
              <option value="draft">Draft</option>
              {canBulkDelete ? <option value="delete">Delete</option> : null}
            </select>
            <AdminBulkSubmitButton disabled={!bulkAction || selectedCount === 0}>
              Áp dụng
            </AdminBulkSubmitButton>
          </NativeForm>

        </div>
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
                  Không có sản phẩm phù hợp với bộ lọc hiện tại.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Đã chọn {selectedCount}</span>
      </div>

      <Dialog open={Boolean(previewOffering)} onOpenChange={(open) => !open && setPreviewOfferingId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          {previewOffering ? (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle>{previewOffering.name}</DialogTitle>
                <DialogDescription>/{previewOffering.slug}</DialogDescription>
              </DialogHeader>

              <PreviewSection title="Tổng quan">
                <div className="grid gap-3 md:grid-cols-2">
                  <PreviewField label="ID" value={<span className="break-all">{previewOffering.id}</span>} />
                  <PreviewField label="Tên sản phẩm" value={previewOffering.name} />
                  <PreviewField label="Slug" value={`/${previewOffering.slug}`} />
                  <PreviewField label="Trạng thái" value={previewOffering.status} />
                  <PreviewField label="Loại" value={getOfferingTypeLabel(previewOffering.offeringType)} />
                  <PreviewField label="Template key" value={previewOffering.templateKey} />
                  <PreviewField
                    label="Category"
                    value={
                      previewOffering.categoryName
                        ? `${previewOffering.categoryName}${previewOffering.categorySlug ? ` / ${previewOffering.categorySlug}` : ""}`
                        : "—"
                    }
                  />
                  <PreviewField label="Category ID" value={<span className="break-all">{previewOffering.categoryId || "—"}</span>} />
                  <PreviewField label="Tạo lúc" value={formatDateTime(previewOffering.createdAt)} />
                  <PreviewField label="Cập nhật lúc" value={formatDateTime(previewOffering.updatedAt)} />
                </div>
              </PreviewSection>

              <PreviewSection title="Giá, kho và nguồn hàng">
                <div className="grid gap-3 md:grid-cols-2">
                  <PreviewField label="Giá bán" value={previewOffering.price} />
                  <PreviewField label="Giá nhập" value={previewOffering.costPrice} />
                  <PreviewField label="Fulfillment" value={getFulfillmentTypeLabel(previewOffering.fulfillmentType)} />
                  <PreviewField
                    label="Kho"
                    value={
                      previewOffering.trackInventory
                        ? `${previewOffering.stockQuantity} • cảnh báo thấp ${previewOffering.lowStockThreshold}${previewOffering.allowBackorder ? " • cho phép backorder" : ""}`
                        : "Không giới hạn tồn kho"
                    }
                  />
                  <PreviewField label="Nguồn hàng" value={previewOffering.ownerType === "vendor" ? "Vendor" : "Nội bộ"} />
                  <PreviewField label="Vendor SKU" value={previewOffering.vendorSku || "—"} />
                  <PreviewField
                    label="Vendor User ID"
                    value={<span className="break-all">{previewOffering.ownerVendorUserId || "—"}</span>}
                    className="md:col-span-2"
                  />
                </div>
              </PreviewSection>

              <PreviewSection title="Nội dung">
                <div className="space-y-3">
                  <PreviewField label="Excerpt" value={previewOffering.excerpt || "—"} />
                  <PreviewField
                    label="Mô tả"
                    value={<span className="whitespace-pre-wrap">{previewOffering.description || "—"}</span>}
                  />
                </div>
              </PreviewSection>

              <PreviewSection title="Media">
                <div className="flex flex-col gap-3 md:flex-row md:items-start">
                  {previewOffering.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewOffering.thumbnailUrl}
                      alt={previewOffering.name}
                      className="h-28 w-28 shrink-0 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-md border text-sm text-muted-foreground">
                      —
                    </div>
                  )}
                  <PreviewField
                    label="Thumbnail URL"
                    value={<span className="break-all">{previewOffering.thumbnailUrl || "—"}</span>}
                    className="min-w-0 flex-1"
                  />
                </div>
              </PreviewSection>

              <PreviewSection title="Config">
                <pre className="max-h-72 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words rounded-md bg-muted/40 p-3 text-xs text-foreground">
                  {JSON.stringify(previewOffering.config ?? {}, null, 2)}
                </pre>
              </PreviewSection>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
