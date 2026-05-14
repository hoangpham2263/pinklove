"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, FilterX } from "lucide-react";
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
import type { BlogCategory, BlogPost } from "@/features/blog/types";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { getBlogPostPath } from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";

type AdminBlogPostsTableProps = {
  posts: BlogPost[];
  categories: BlogCategory[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function AdminBlogPostsTable({ posts, categories }: AdminBlogPostsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [previewPostId, setPreviewPostId] = useState<string | null>(null);
  const previewPost = previewPostId ? posts.find((post) => post.id === previewPostId) ?? null : null;

  const columns = useMemo<ColumnDef<BlogPost>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Tiêu đề
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => row.original.title,
      },
      {
        accessorKey: "slug",
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Slug
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <code>/{row.original.slug}</code>,
      },
      {
        accessorKey: "categoryName",
        header: "Category",
        cell: ({ row }) => <span>{row.original.categoryName}</span>,
      },
      {
        accessorKey: "categoryId",
        header: "Category ID",
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>(columnId) === filterValue;
        },
        cell: () => null,
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
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => {
          const post = row.original;

          return (
            <AdminTableActions>
              <AdminTableActionButton action="view" label="Xem bài viết" onClick={() => setPreviewPostId(post.id)} />
              <AdminTableActionButton action="external" label="Xem ngoài site" href={getBlogPostPath(post)} target="_blank" />
              <AdminTableActionButton action="edit" label="Chỉnh sửa" href={`${ROUTES.ADMIN.BLOG_ENTRY(post.slug)}?returnTo=${encodeURIComponent(ROUTES.ADMIN.BLOG)}`} />
              <NativeForm
                action={adminApiActions.deleteBlogPost}
                method="POST"
                className="inline-block"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!confirm(`Bạn có chắc chắn muốn xóa bài viết: ${post.title}?`)) {
                    return;
                  }

                  try {
                    const result = await adminApi.deleteBlogPost(new FormData(event.currentTarget));
                    toast.success(result.message ?? "Đã xóa bài viết.");
                    finishMutation(router, result, { redirect: false, refresh: true });
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Không thể xóa bài viết.");
                  }
                }}
              >
                <input type="hidden" name="slug" value={post.slug} />
                <AdminTableActionButton action="delete" label="Xóa bài viết" type="submit" />
              </NativeForm>
            </AdminTableActions>
          );
        },
      },
    ],
    [router]
  );

  const table = useReactTable({
    data: posts,
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

      const post = row.original;
      return [post.title, post.slug, post.excerpt, post.content, post.status, post.categoryName, post.categorySlug]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const statusFilterValue = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "";
  const categoryFilterValue = (table.getColumn("categoryId")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters = globalFilter.trim().length > 0 || statusFilterValue.length > 0 || categoryFilterValue.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-3 md:grid-cols-[minmax(0,320px)_220px_220px_auto]">
          <Input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Tìm theo tiêu đề, slug, nội dung..."
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
          <select
            value={categoryFilterValue}
            onChange={(event) => table.getColumn("categoryId")?.setFilterValue(event.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {hasFilters ? (
            <Button
              variant="default"
              size="icon-lg"
              aria-label="Xóa bộ lọc"
              title="Xóa bộ lọc"
              onClick={() => {
                setGlobalFilter("");
                table.getColumn("status")?.setFilterValue("");
                table.getColumn("categoryId")?.setFilterValue("");
              }}
            >
              <FilterX className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) =>
                  header.column.id === "categoryId" ? null : (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                )}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) =>
                    cell.column.id === "categoryId" ? null : (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    )
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length - 1} className="h-24 text-center">
                  Không có bài viết phù hợp với bộ lọc hiện tại.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(previewPost)} onOpenChange={(open) => !open && setPreviewPostId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {previewPost ? (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle>Chi tiết bài viết</DialogTitle>
                <DialogDescription>Xem đầy đủ thông tin bài viết trước khi chỉnh sửa.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Tiêu đề</p>
                  <p className="text-sm text-muted-foreground">{previewPost.title}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Slug</p>
                  <p className="text-sm text-muted-foreground">/{previewPost.slug}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Danh mục</p>
                  <p className="text-sm text-muted-foreground">{previewPost.categoryName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Trạng thái</p>
                  <Badge variant={previewPost.status === "published" ? "default" : "secondary"}>{previewPost.status}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Ngày tạo</p>
                  <p className="text-sm text-muted-foreground">{formatDate(previewPost.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Cập nhật</p>
                  <p className="text-sm text-muted-foreground">{formatDate(previewPost.updatedAt)}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Mô tả ngắn</p>
                <p className="rounded-md border p-3 text-sm text-muted-foreground">{previewPost.excerpt || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Nội dung</p>
                <p className="max-h-60 overflow-y-auto whitespace-pre-line rounded-md border p-3 text-sm text-muted-foreground">
                  {previewPost.content || "-"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Ảnh cover</p>
                <p className="break-all rounded-md border p-3 text-sm text-muted-foreground">{previewPost.coverImage || "-"}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
