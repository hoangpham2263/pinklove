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
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminTableActionButton, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import { AdminTableClearButton, AdminTableSearch, AdminTableSelect, AdminTableToolbar } from "@/features/admin/components/admin-table-controls";
import type { CommentStatus, ContentComment } from "@/features/comments/types";
import { ROUTES } from "@/lib/routes";

type AdminCommentsTableProps = {
  comments: ContentComment[];
  status: string;
  keyword: string;
};

function getStatusLabel(status: CommentStatus) {
  switch (status) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "spam":
      return "Spam";
    case "deleted":
      return "Deleted";
    default:
      return "Pending";
  }
}

function getStatusVariant(status: CommentStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "approved") return "default";
  if (status === "rejected" || status === "spam") return "destructive";
  if (status === "deleted") return "outline";
  return "secondary";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

function statusAction(comment: ContentComment, status: CommentStatus, label: string) {
  const action = status === "approved" ? "approve" : status === "spam" ? "spam" : "reject";

  return (
    <form action={ROUTES.API.ADMIN.COMMENTS.UPDATE_STATUS} method="POST" className="inline-block">
      <input type="hidden" name="id" value={comment.id} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="returnTo" value={ROUTES.ADMIN.COMMENTS} />
      <AdminTableActionButton action={action} label={label} type="submit" />
    </form>
  );
}

export function AdminCommentsTable({ comments, status, keyword }: AdminCommentsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    ...(status && status !== "all" ? [{ id: "status", value: status }] : []),
  ]);
  const [globalFilter, setGlobalFilter] = useState(keyword);
  const [previewCommentId, setPreviewCommentId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<ContentComment>[]>(
    () => [
      {
        accessorKey: "content",
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Comment
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="max-w-xl">
            <p className="font-medium text-foreground">{row.original.authorName}</p>
            {row.original.authorEmail ? <p className="mt-1 text-xs text-muted-foreground">{row.original.authorEmail}</p> : null}
            <p className="mt-2 line-clamp-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{row.original.content}</p>
          </div>
        ),
      },
      {
        accessorKey: "targetTitle",
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Target
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.targetTitle}</p>
            <p className="mt-1 text-xs text-muted-foreground">{row.original.targetType}</p>
          </div>
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
        cell: ({ row }) => <Badge variant={getStatusVariant(row.original.status)}>{getStatusLabel(row.original.status)}</Badge>,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Tạo lúc
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <span>{formatDate(row.original.createdAt)}</span>,
      },
      {
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => {
          const comment = row.original;

          return (
            <AdminTableActions>
              <AdminTableActionButton action="view" label="Xem comment" onClick={() => setPreviewCommentId(comment.id)} />
              {comment.targetUrl ? (
                <AdminTableActionButton action="external" label="Xem ngoài site" href={comment.targetUrl} target="_blank" />
              ) : null}
              {comment.status !== "approved"
                ? statusAction(comment, "approved", "Approve")
                : null}
              {comment.status !== "rejected"
                ? statusAction(comment, "rejected", "Reject")
                : null}
              {comment.status !== "spam"
                ? statusAction(comment, "spam", "Mark spam")
                : null}
              <form action={ROUTES.API.ADMIN.COMMENTS.DELETE} method="POST" className="inline-block">
                <input type="hidden" name="id" value={comment.id} />
                <input type="hidden" name="returnTo" value={ROUTES.ADMIN.COMMENTS} />
                <AdminTableActionButton
                  action="delete"
                  label="Delete"
                  type="submit"
                  onClick={(event) => {
                    if (!confirm(`Xóa comment của ${comment.authorName}?`)) {
                      event.preventDefault();
                    }
                  }}
                />
              </form>
            </AdminTableActions>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: comments,
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
      const search = String(filterValue).trim().toLowerCase();
      if (!search) return true;

      const comment = row.original;
      return [
        comment.authorName,
        comment.authorEmail,
        comment.content,
        comment.status,
        comment.targetTitle,
        comment.targetSlug,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const statusFilterValue = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters = globalFilter.trim().length > 0 || statusFilterValue.length > 0;
  const previewComment = previewCommentId ? comments.find((comment) => comment.id === previewCommentId) ?? null : null;

  return (
    <div className="space-y-4">
      <AdminTableToolbar>
        <AdminTableSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Tìm theo tên, email, nội dung..." />
        <AdminTableSelect
          value={statusFilterValue}
          label="Lọc trạng thái"
          onChange={(value) => table.getColumn("status")?.setFilterValue(value)}
          options={[
            { value: "", label: "Tất cả trạng thái" },
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
            { value: "spam", label: "Spam" },
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
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Không có comment phù hợp với bộ lọc hiện tại.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(previewComment)} onOpenChange={(open) => !open && setPreviewCommentId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {previewComment ? (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle>Chi tiết comment</DialogTitle>
                <DialogDescription>Xem đầy đủ thông tin comment trước khi duyệt.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Tên</p>
                  <p className="text-sm text-muted-foreground">{previewComment.authorName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{previewComment.authorEmail || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Target</p>
                  <p className="text-sm text-muted-foreground">{previewComment.targetTitle}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Trạng thái</p>
                  <p className="text-sm text-muted-foreground">{getStatusLabel(previewComment.status)}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Nội dung</p>
                <p className="whitespace-pre-line rounded-md border p-3 text-sm leading-6 text-muted-foreground">{previewComment.content}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
