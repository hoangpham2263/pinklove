"use client";

import { useMemo, useState } from "react";
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
import { ROUTES } from "@/lib/routes";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import type { Product, ProductType } from "@/features/products/types";
import { getProductPath } from "@/lib/public-paths";

function getProductTypeLabel(productType: ProductType) {
  switch (productType) {
    case "builder_template":
      return "Builder Template";
    case "general_product":
      return "Sản phẩm";
    default:
      return "Coded Template";
  }
}

type AdminProductListProps = {
  products: Product[];
  search: string;
  status: "" | Product["status"];
  productType: "" | ProductType;
  title?: string;
  returnTo?: string;
  lockProductType?: boolean;
};

export function AdminProductList({
  products,
  search,
  status,
  productType,
  title,
  returnTo = ROUTES.ADMIN.PRODUCT_LIST,
  lockProductType = false,
}: AdminProductListProps) {
  const router = useRouter();
  const showInventoryColumn = productType === "general_product";
  const canBulkDelete = productType !== "coded_template";
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    ...(status ? [{ id: "status", value: status }] : []),
    ...(productType ? [{ id: "productType", value: productType }] : []),
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
        accessorKey: "name",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Tên sản phẩm</AdminTableSortButton>
        ),
        cell: ({ row }) => <span>{row.original.name}</span>,
      },
      {
        accessorKey: "slug",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Slug</AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <code>/{row.original.slug}</code>
        ),
      },
      {
        accessorKey: "productType",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Loại</AdminTableSortButton>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>(columnId) === filterValue;
        },
        cell: ({ row }) => (
          <Badge variant="secondary">{getProductTypeLabel(row.original.productType)}</Badge>
        ),
      },
      {
        accessorKey: "categoryName",
        header: "Category",
        cell: ({ row }) => row.original.categoryName ? <span>{row.original.categoryName}</span> : <span className="text-muted-foreground">-</span>,
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
      ...(showInventoryColumn
        ? [{
            id: "owner",
            header: "Nguồn hàng",
            cell: ({ row }: { row: { original: Product } }) => (
              <div className="space-y-1">
                <p>{row.original.ownerType === "vendor" ? "Vendor" : "Nội bộ"}</p>
                {row.original.ownerType === "vendor" ? (
                  <p className="text-xs text-muted-foreground">{row.original.vendorSku || "Chưa có SKU"}</p>
                ) : null}
              </div>
            ),
          } satisfies ColumnDef<Product>]
        : []),
      {
        accessorKey: "price",
        header: ({ column }) => (
          <div className="text-right">
            <AdminTableSortButton align="right" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Giá</AdminTableSortButton>
          </div>
        ),
        cell: ({ row }) => <div className="text-right font-medium">{row.original.price}</div>,
      },
      ...(showInventoryColumn
        ? [{
            id: "costPrice",
            header: () => <div className="text-right">Giá nhập</div>,
            cell: ({ row }: { row: { original: Product } }) => <div className="text-right text-sm">{row.original.costPrice}</div>,
          } satisfies ColumnDef<Product>]
        : []),
      ...(showInventoryColumn
        ? [{
            id: "inventory",
            header: () => <div className="text-right">Kho</div>,
            cell: ({ row }: { row: { original: Product } }) => {
              const product = row.original;
              if (!product.trackInventory) {
                return <div className="text-right text-sm text-muted-foreground">Khong gioi han</div>;
              }

              const tone =
                product.stockQuantity <= 0
                  ? "text-red-600"
                  : product.stockQuantity <= product.lowStockThreshold
                    ? "text-amber-600"
                    : "text-foreground";

              return (
                <div className={`text-right text-sm font-medium ${tone}`}>
                  {product.stockQuantity}
                  {product.allowBackorder ? " • backorder" : ""}
                </div>
              );
            },
          } satisfies ColumnDef<Product>]
        : []),
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
            product.productType === "builder_template"
              ? `${ROUTES.ADMIN.BUILDER_TEMPLATE_EDITOR(product.slug)}?returnTo=${encodeURIComponent(returnTo)}`
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
    [router, showInventoryColumn, returnTo]
  );

  const table = useReactTable({
    data: products,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
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
              if (!lockProductType) {
                table.getColumn("productType")?.setFilterValue("");
              }
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
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {previewProduct ? (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle>Chi tiết sản phẩm</DialogTitle>
                <DialogDescription>Xem đầy đủ thông tin của sản phẩm.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Tên sản phẩm</p>
                  <p className="text-sm text-muted-foreground">{previewProduct.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Slug</p>
                  <p className="text-sm text-muted-foreground">/{previewProduct.slug}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Trạng thái</p>
                  <p className="text-sm text-muted-foreground">{previewProduct.status}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Loại</p>
                  <p className="text-sm text-muted-foreground">{getProductTypeLabel(previewProduct.productType)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Giá</p>
                  <p className="text-sm text-muted-foreground">{previewProduct.price}</p>
                </div>
                {previewProduct.productType === "general_product" ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Kho</p>
                    <p className="text-sm text-muted-foreground">
                      {previewProduct.trackInventory
                        ? `${previewProduct.stockQuantity} • cảnh báo thấp ${previewProduct.lowStockThreshold}${previewProduct.allowBackorder ? " • cho phép backorder" : ""}`
                        : "Không giới hạn tồn kho"}
                    </p>
                  </div>
                ) : null}
                <div className="space-y-1">
                  <p className="text-sm font-medium">Template Key</p>
                  <p className="text-sm text-muted-foreground">{previewProduct.templateKey}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Tạo lúc</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(previewProduct.createdAt).toISOString().slice(0, 16).replace("T", " ")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Cập nhật lúc</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(previewProduct.updatedAt).toISOString().slice(0, 16).replace("T", " ")}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Excerpt</p>
                <p className="rounded-md border p-3 text-sm text-muted-foreground">{previewProduct.excerpt || "—"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Mô tả</p>
                <p className="rounded-md border p-3 text-sm text-muted-foreground">
                  {previewProduct.description || "—"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Thumbnail</p>
                <p className="break-all rounded-md border p-3 text-sm text-muted-foreground">
                  {previewProduct.thumbnailUrl || "—"}
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
