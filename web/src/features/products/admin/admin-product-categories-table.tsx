"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, Eye, FilterX, Pencil, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { slugify } from "@/lib/utils";
import type { ProductCategory } from "@/features/products/types";

type ProductCategoryRow = ProductCategory & {
  productCount: number;
};

type AdminProductCategoriesTableProps = {
  categories: ProductCategory[];
  productCountByCategory: Record<string, number>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function AdminProductCategoriesTable({
  categories,
  productCountByCategory,
}: AdminProductCategoriesTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkAction, setBulkAction] = useState("");
  const [previewCategoryId, setPreviewCategoryId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const data = useMemo<ProductCategoryRow[]>(
    () =>
      categories.map((category) => ({
        ...category,
        productCount: productCountByCategory[category.id] ?? 0,
      })),
    [categories, productCountByCategory]
  );
  const previewCategory = data.find((category) => category.id === previewCategoryId) ?? null;
  const editingCategory = data.find((category) => category.id === editingCategoryId) ?? null;

  const columns = useMemo<ColumnDef<ProductCategoryRow>[]>(
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
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tên category
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
      },
      {
        accessorKey: "slug",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Slug
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <span>/{row.original.slug}</span>,
      },
      {
        accessorKey: "productCount",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Sản phẩm
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Trạng thái
            <ArrowUpDown className="h-4 w-4" />
          </Button>
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
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Updated
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => formatDate(row.original.updatedAt),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => {
          const category = row.original;

          return (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                title="Xem nhanh Product Cat"
                onClick={() => setPreviewCategoryId(category.id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                className="h-8 w-8"
                title="Chỉnh sửa Product Cat"
                onClick={() => setEditingCategoryId(category.id)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <NativeForm
                action={adminApiActions.deleteProductCategory}
                method="POST"
                className="inline-block"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!confirm(`Bạn có chắc chắn muốn xóa Product Cat: ${category.name}?`)) {
                    return;
                  }

                  try {
                    const result = await adminApi.deleteProductCategory(new FormData(event.currentTarget));
                    toast.success(result.message ?? "Đã xóa Product Cat.");
                    finishMutation(router, result, { redirect: false, refresh: true });
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Không thể xóa Product Cat.");
                  }
                }}
              >
                <input type="hidden" name="slug" value={category.slug} />
                <Button
                  type="submit"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 border border-destructive/50"
                  title="Xóa Product Cat"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </NativeForm>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data,
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

      const category = row.original;
      return [category.name, category.slug, category.description, category.status]
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

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-3 md:grid-cols-[minmax(0,320px)_220px_auto]">
            <Input
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Tìm theo tên, slug, mô tả..."
              className="h-9"
            />
            <select
              value={statusFilterValue}
              onChange={(event) => table.getColumn("status")?.setFilterValue(event.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            {hasFilters ? (
              <Button
                type="button"
                variant="default"
                size="icon-lg"
                aria-label="Xóa bộ lọc"
                title="Xóa bộ lọc"
                onClick={() => {
                  setGlobalFilter("");
                  table.getColumn("status")?.setFilterValue("");
                }}
              >
                <FilterX className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <NativeForm
              action={adminApiActions.bulkUpdateProductCategories}
              method="POST"
              className="flex flex-col gap-3 md:flex-row md:items-center"
              onSubmit={async (event) => {
                if (!bulkAction || selectedCount === 0) {
                  event.preventDefault();
                  return;
                }

                event.preventDefault();

                if (bulkAction === "delete" && !confirm(`Xóa ${selectedCount} Product Cat đã chọn?`)) {
                  return;
                }

                try {
                  const result = await adminApi.bulkUpdateProductCategories(new FormData(event.currentTarget));
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
              <span className="text-muted-foreground text-sm">Đã chọn {selectedCount}</span>
              <select
                name="bulkAction"
                value={bulkAction}
                onChange={(event) => setBulkAction(event.target.value)}
                className="h-9 min-w-52 rounded-lg border border-input bg-background px-3 text-sm outline-none"
              >
                <option value="">Tác vụ hàng loạt</option>
                <option value="publish">Published</option>
                <option value="draft">Draft</option>
                <option value="delete">Delete</option>
              </select>
              <Button type="submit" className="h-9" disabled={!bulkAction || selectedCount === 0}>
                Áp dụng
              </Button>
            </NativeForm>
          </div>
        </div>

        <div className="rounded-lg border">
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
                    Không có Product Cat phù hợp với bộ lọc hiện tại.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={Boolean(previewCategory)} onOpenChange={(open) => !open && setPreviewCategoryId(null)}>
        {previewCategory ? (
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Xem nhanh Product Cat</DialogTitle>
              <DialogDescription>Xem nhanh toàn bộ thông tin danh mục trước khi chỉnh sửa.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium">Tên</p>
                <p className="text-sm text-muted-foreground">{previewCategory.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Slug</p>
                <p className="text-sm text-muted-foreground">/{previewCategory.slug}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Trạng thái</p>
                <Badge variant={previewCategory.status === "published" ? "default" : "secondary"}>
                  {previewCategory.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Số sản phẩm</p>
                <p className="text-sm text-muted-foreground">{previewCategory.productCount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Ngày tạo</p>
                <p className="text-sm text-muted-foreground">{formatDate(previewCategory.createdAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Cập nhật</p>
                <p className="text-sm text-muted-foreground">{formatDate(previewCategory.updatedAt)}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Mô tả</p>
              <div className="rounded-md border p-3 text-sm text-muted-foreground">
                {previewCategory.description || "—"}
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={() => {
                setPreviewCategoryId(null);
                setEditingCategoryId(previewCategory.id);
              }}>
                Chỉnh sửa
              </Button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>

      <Dialog open={Boolean(editingCategory)} onOpenChange={(open) => !open && setEditingCategoryId(null)}>
      {editingCategory ? (
        <DialogContent className="max-w-xl">
          <ProductCategoryPopupForm
            category={editingCategory}
            onClose={() => setEditingCategoryId(null)}
          />
        </DialogContent>
      ) : null}
      </Dialog>
    </>
  );
}

function ProductCategoryPopupForm({
  category,
  onClose,
}: {
  category: ProductCategoryRow;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = await adminApi.updateProductCategory(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã lưu Product Cat.");
      finishMutation(router, result, { redirect: false, refresh: true });
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu Product Cat.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Bạn có chắc chắn muốn xóa Product Cat: ${category.name}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("slug", category.slug);
      const result = await adminApi.deleteProductCategory(formData);
      toast.success(result.message ?? "Đã xóa Product Cat.");
      finishMutation(router, result, { redirect: false, refresh: true });
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa Product Cat.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Chỉnh Product Cat</DialogTitle>
        <DialogDescription>Sửa nhanh danh mục sản phẩm ngay tại bảng, không cần chuyển trang.</DialogDescription>
      </DialogHeader>

      <NativeForm action={adminApiActions.updateProductCategory} method="POST" className="space-y-4" onSubmit={handleSave}>
        <input type="hidden" name="originalSlug" value={category.slug} />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="font-medium text-sm">Tên Product Cat</label>
            <Input
              name="name"
              value={name}
              onChange={(event) => {
                const next = event.target.value;
                setName(next);
                setSlug(slugify(next));
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="font-medium text-sm">Slug</label>
            <Input name="slug" value={slug} onChange={(event) => setSlug(event.target.value)} required />
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-medium text-sm">Mô tả</label>
          <textarea
            name="description"
            defaultValue={category.description}
            className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label className="font-medium text-sm">Trạng thái</label>
          <select
            name="status"
            defaultValue={category.status}
            className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button type="button" variant="destructive" disabled={isDeleting} onClick={() => void handleDelete()}>
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Đang xóa..." : "Xóa Product Cat"}
          </Button>
          <div className="flex gap-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu Product Cat"}
            </Button>
          </div>
        </div>
      </NativeForm>
    </>
  );
}
