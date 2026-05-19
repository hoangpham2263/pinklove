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
import { getProductTypeLabel, type Product, type ProductType } from "@/features/products/types";
import { getProductPath } from "@/lib/public-paths";

function formatDateTime(value: string) {
  return new Date(value).toISOString().slice(0, 16).replace("T", " ");
}

function getFulfillmentTypeLabel(fulfillmentType: Product["fulfillmentType"]) {
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

type AdminProductListProps = {
  products: Product[];
  search: string;
  status: "" | Product["status"];
  productType: "" | ProductType;
  title?: string;
  returnTo?: string;
};

export function AdminProductList({
  products,
  search,
  status,
  productType,
  title,
  returnTo = ROUTES.ADMIN.PRODUCT_LIST,
}: AdminProductListProps) {
  const router = useRouter();
  const canBulkDelete = productType !== "coded_template";
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    ...(status ? [{ id: "status", value: status }] : []),
  ]);
  const [globalFilter, setGlobalFilter] = useState(search);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkAction, setBulkAction] = useState("");
  const [previewProductId, setPreviewProductId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<Product>[]>(
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
        accessorKey: "productType",
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
          const product = row.original;
          const canDeleteProduct = product.productType !== "coded_template";
          const publicHref = getProductPath(product);
          const adminEditHref =
            product.productType === "builder"
              ? `${ROUTES.ADMIN.BUILDER_EDITOR(product.slug)}?returnTo=${encodeURIComponent(returnTo)}`
              : product.productType === "coded_template"
                ? `${ROUTES.ADMIN.CODED_TEMPLATE(product.slug)}?returnTo=${encodeURIComponent(returnTo)}`
              : `${ROUTES.ADMIN.PRODUCT(product.slug)}?returnTo=${encodeURIComponent(returnTo)}`;

          return (
            <AdminTableActions>
              <AdminTableActionButton action="view" label="Xem sản phẩm" onClick={() => setPreviewProductId(product.id)} />
              <AdminTableActionButton action="external" label="Xem ngoài site" href={publicHref} target="_blank" />
              <AdminTableActionButton action="edit" label="Chỉnh sửa" href={adminEditHref} />
              {canDeleteProduct ? (
                <NativeForm
                  action={adminApiActions.deleteProduct}
                  method="POST"
                  className="inline-block"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm: ${product.name}?`)) {
                      return;
                    }

                    try {
                      const result = await adminApi.deleteProduct(new FormData(event.currentTarget));
                      toast.success(result.message ?? "Đã xóa sản phẩm.");
                      finishMutation(router, result, { redirect: false });
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Không thể xóa sản phẩm.");
                    }
                  }}
                >
                  <input type="hidden" name="slug" value={product.slug} />
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
    data: products,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
      columnVisibility: {
        productType: false,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: (row, _columnId, filterValue) => {
      const keyword = String(filterValue).trim().toLowerCase();
      if (!keyword) return true;

      const product = row.original;
      return [
        product.name,
        product.slug,
        product.templateKey,
        product.status,
        product.productType,
        product.excerpt,
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
  const previewProduct = previewProductId ? products.find((product) => product.id === previewProductId) ?? null : null;

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
            action={adminApiActions.bulkUpdateProducts}
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
                const result = await adminApi.bulkUpdateProducts(new FormData(event.currentTarget));
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

      <Dialog open={Boolean(previewProduct)} onOpenChange={(open) => !open && setPreviewProductId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          {previewProduct ? (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle>{previewProduct.name}</DialogTitle>
                <DialogDescription>/{previewProduct.slug}</DialogDescription>
              </DialogHeader>

              <PreviewSection title="Tổng quan">
                <div className="grid gap-3 md:grid-cols-2">
                  <PreviewField label="ID" value={<span className="break-all">{previewProduct.id}</span>} />
                  <PreviewField label="Tên sản phẩm" value={previewProduct.name} />
                  <PreviewField label="Slug" value={`/${previewProduct.slug}`} />
                  <PreviewField label="Trạng thái" value={previewProduct.status} />
                  <PreviewField label="Loại" value={getProductTypeLabel(previewProduct.productType)} />
                  <PreviewField label="Template key" value={previewProduct.templateKey} />
                  <PreviewField
                    label="Category"
                    value={
                      previewProduct.categoryName
                        ? `${previewProduct.categoryName}${previewProduct.categorySlug ? ` / ${previewProduct.categorySlug}` : ""}`
                        : "—"
                    }
                  />
                  <PreviewField label="Category ID" value={<span className="break-all">{previewProduct.categoryId || "—"}</span>} />
                  <PreviewField label="Tạo lúc" value={formatDateTime(previewProduct.createdAt)} />
                  <PreviewField label="Cập nhật lúc" value={formatDateTime(previewProduct.updatedAt)} />
                </div>
              </PreviewSection>

              <PreviewSection title="Giá, kho và nguồn hàng">
                <div className="grid gap-3 md:grid-cols-2">
                  <PreviewField label="Giá bán" value={previewProduct.price} />
                  <PreviewField label="Giá nhập" value={previewProduct.costPrice} />
                  <PreviewField label="Fulfillment" value={getFulfillmentTypeLabel(previewProduct.fulfillmentType)} />
                  <PreviewField
                    label="Kho"
                    value={
                      previewProduct.trackInventory
                        ? `${previewProduct.stockQuantity} • cảnh báo thấp ${previewProduct.lowStockThreshold}${previewProduct.allowBackorder ? " • cho phép backorder" : ""}`
                        : "Không giới hạn tồn kho"
                    }
                  />
                  <PreviewField label="Nguồn hàng" value={previewProduct.ownerType === "vendor" ? "Vendor" : "Nội bộ"} />
                  <PreviewField label="Vendor SKU" value={previewProduct.vendorSku || "—"} />
                  <PreviewField
                    label="Vendor User ID"
                    value={<span className="break-all">{previewProduct.ownerVendorUserId || "—"}</span>}
                    className="md:col-span-2"
                  />
                </div>
              </PreviewSection>

              <PreviewSection title="Nội dung">
                <div className="space-y-3">
                  <PreviewField label="Excerpt" value={previewProduct.excerpt || "—"} />
                  <PreviewField
                    label="Mô tả"
                    value={<span className="whitespace-pre-wrap">{previewProduct.description || "—"}</span>}
                  />
                </div>
              </PreviewSection>

              <PreviewSection title="Media">
                <div className="flex flex-col gap-3 md:flex-row md:items-start">
                  {previewProduct.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewProduct.thumbnailUrl}
                      alt={previewProduct.name}
                      className="h-28 w-28 shrink-0 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-md border text-sm text-muted-foreground">
                      —
                    </div>
                  )}
                  <PreviewField
                    label="Thumbnail URL"
                    value={<span className="break-all">{previewProduct.thumbnailUrl || "—"}</span>}
                    className="min-w-0 flex-1"
                  />
                </div>
              </PreviewSection>

              <PreviewSection title="Config">
                <pre className="max-h-72 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words rounded-md bg-muted/40 p-3 text-xs text-foreground">
                  {JSON.stringify(previewProduct.config ?? {}, null, 2)}
                </pre>
              </PreviewSection>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
