"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
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

import { NativeForm } from "@/components/common/native-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminTableActionButton, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import { AdminTableClearButton, AdminTableSearch, AdminTableSelect, AdminTableToolbar } from "@/features/admin/components/admin-table-controls";
import type { BlogCategory } from "@/features/blog/types";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { slugify } from "@/lib/utils";

type BlogCategoryRow = BlogCategory & {
  postCount: number;
};

type AdminBlogCategoriesTableProps = {
  categories: BlogCategory[];
  postCountByCategory: Record<string, number>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function AdminBlogCategoriesTable({ categories, postCountByCategory }: AdminBlogCategoriesTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [previewCategoryId, setPreviewCategoryId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const data = useMemo<BlogCategoryRow[]>(
    () =>
      categories.map((category) => ({
        ...category,
        postCount: postCountByCategory[category.id] ?? 0,
      })),
    [categories, postCountByCategory]
  );
  const previewCategory = data.find((category) => category.id === previewCategoryId) ?? null;
  const editingCategory = data.find((category) => category.id === editingCategoryId) ?? null;

  const columns = useMemo<ColumnDef<BlogCategoryRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Tên category
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
      },
      {
        accessorKey: "slug",
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Slug
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <span>/{row.original.slug}</span>,
      },
      {
        accessorKey: "postCount",
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Bài viết
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Trạng thái
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>(columnId) === filterValue;
        },
        cell: ({ row }) => <Badge variant={row.original.status === "published" ? "default" : "secondary"}>{row.original.status}</Badge>,
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
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
            <AdminTableActions>
              <AdminTableActionButton action="view" label="Xem nhanh Blog Category" onClick={() => setPreviewCategoryId(category.id)} />
              <AdminTableActionButton action="edit" label="Chỉnh sửa Blog Category" onClick={() => setEditingCategoryId(category.id)} />
              <NativeForm
                action={adminApiActions.deleteBlogCategory}
                method="POST"
                className="inline-block"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!confirm(`Bạn có chắc chắn muốn xóa Blog Category: ${category.name}?`)) {
                    return;
                  }

                  try {
                    const result = await adminApi.deleteBlogCategory(new FormData(event.currentTarget));
                    toast.success(result.message ?? "Đã xóa Blog Category.");
                    finishMutation(router, result, { redirect: false, refresh: true });
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Không thể xóa Blog Category.");
                  }
                }}
              >
                <input type="hidden" name="slug" value={category.slug} />
                <AdminTableActionButton action="delete" label="Xóa Blog Category" type="submit" />
              </NativeForm>
            </AdminTableActions>
          );
        },
      },
    ],
    [router]
  );

  const table = useReactTable({
    data,
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

      const category = row.original;
      return [category.name, category.slug, category.description, category.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const statusFilterValue = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters = globalFilter.trim().length > 0 || statusFilterValue.length > 0;

  return (
    <>
      <div className="space-y-4">
        <AdminTableToolbar>
          <AdminTableSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Tìm theo tên, slug, mô tả..." />
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
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Không có Blog Category phù hợp với bộ lọc hiện tại.
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
              <DialogTitle>Xem nhanh Blog Category</DialogTitle>
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
                <Badge variant={previewCategory.status === "published" ? "default" : "secondary"}>{previewCategory.status}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Số bài viết</p>
                <p className="text-sm text-muted-foreground">{previewCategory.postCount}</p>
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
              <div className="rounded-md border p-3 text-sm text-muted-foreground">{previewCategory.description || "-"}</div>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => {
                  setPreviewCategoryId(null);
                  setEditingCategoryId(previewCategory.id);
                }}
              >
                Chỉnh sửa
              </Button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>

      <Dialog open={Boolean(editingCategory)} onOpenChange={(open) => !open && setEditingCategoryId(null)}>
        {editingCategory ? (
          <DialogContent className="max-w-xl">
            <BlogCategoryPopupForm category={editingCategory} onClose={() => setEditingCategoryId(null)} />
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}

function BlogCategoryPopupForm({ category, onClose }: { category: BlogCategoryRow; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = await adminApi.updateBlogCategory(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã lưu Blog Category.");
      finishMutation(router, result, { redirect: false, refresh: true });
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu Blog Category.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Bạn có chắc chắn muốn xóa Blog Category: ${category.name}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("slug", category.slug);
      const result = await adminApi.deleteBlogCategory(formData);
      toast.success(result.message ?? "Đã xóa Blog Category.");
      finishMutation(router, result, { redirect: false, refresh: true });
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa Blog Category.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Chỉnh Blog Category</DialogTitle>
        <DialogDescription>Sửa nhanh danh mục blog ngay tại bảng, không cần chuyển trang.</DialogDescription>
      </DialogHeader>

      <NativeForm action={adminApiActions.updateBlogCategory} method="POST" className="space-y-4" onSubmit={handleSave}>
        <input type="hidden" name="originalSlug" value={category.slug} />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="font-medium text-sm">Tên danh mục</label>
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
            {isDeleting ? "Đang xóa..." : "Xóa Blog Category"}
          </Button>
          <div className="flex gap-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu Blog Category"}
            </Button>
          </div>
        </div>
      </NativeForm>
    </>
  );
}
