"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpDown, Eye, Pencil, Trash2, X } from "lucide-react";
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
import { AccountUser, AuthUser } from "@/lib/auth";
import { finishMutation, postForm } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";

interface UserManagementProps {
  initialUsers: AccountUser[];
  actor: AuthUser;
}

export function UserManagement({ initialUsers, actor }: UserManagementProps) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [bulkAction, setBulkAction] = React.useState("");
  const [previewUserId, setPreviewUserId] = React.useState<string | null>(null);

  const columns = React.useMemo<ColumnDef<AccountUser>[]>(
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
            aria-label={`Select ${row.original.username}`}
            className="h-4 w-4 rounded border border-input"
            checked={row.getIsSelected()}
            disabled={row.original.id === actor.id}
            onChange={(event) => row.toggleSelected(event.target.checked)}
          />
        ),
      },
      {
        accessorKey: "username",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tên đăng nhập
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center">
            {row.original.username}
            {row.original.id === actor.id ? (
              <span className="ml-2 text-xs italic text-muted-foreground">(bạn)</span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Vai trò
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>(columnId) === filterValue;
        },
        cell: ({ row }) => (
          <Badge variant={row.original.role === "admin" ? "default" : "secondary"}>
            {row.original.role}
          </Badge>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => {
          const user = row.original;
          const isSelf = user.id === actor.id;

          return (
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPreviewUserId(user.id)}>
                <Eye className="h-4 w-4" />
                Xem
              </Button>

              <Link
                href={`/admin/users/${user.id}`}
                title="Sửa thông tin"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent"
              >
                <Pencil className="h-4 w-4" />
              </Link>

              <NativeForm
                action={ROUTES.API.ADMIN.USERS.DELETE}
                method="POST"
                className="inline-block"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!confirm(`Bạn có chắc chắn muốn xóa người dùng: ${user.username}?`)) {
                    return;
                  }

                  try {
                    const result = await postForm(ROUTES.API.ADMIN.USERS.DELETE, new FormData(event.currentTarget));
                    toast.success(result.message ?? "Đã xóa tài khoản.");
                    finishMutation(router, result, { redirect: false });
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Không thể xóa tài khoản.");
                  }
                }}
              >
                <input type="hidden" name="userId" value={String(user.id)} />
                <Button
                  type="submit"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 border border-destructive/50"
                  disabled={isSelf}
                  title={isSelf ? "Không thể tự xóa bản thân" : "Xóa tài khoản"}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </NativeForm>
            </div>
          );
        },
      },
    ],
    [actor.id, router]
  );

  const table = useReactTable({
    data: initialUsers,
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

      const user = row.original;
      return [user.username, user.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: (row) => row.original.id !== actor.id,
  });

  const roleFilterValue = (table.getColumn("role")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters = globalFilter.trim().length > 0 || roleFilterValue.length > 0;
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const previewUser = previewUserId ? initialUsers.find((user) => user.id === previewUserId) ?? null : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid gap-3 md:grid-cols-[minmax(0,320px)_220px]">
          <Input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Tìm theo tên đăng nhập hoặc vai trò..."
            className="h-9"
          />
          <select
            value={roleFilterValue}
            onChange={(event) => table.getColumn("role")?.setFilterValue(event.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:ring-1 focus:ring-ring"
          >
            <option value="">Tất cả vai trò</option>
            <option value="admin">admin</option>
            <option value="user">user</option>
          </select>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <NativeForm
            action={ROUTES.API.ADMIN.USERS.BULK}
            method="POST"
            className="flex flex-col gap-3 md:flex-row md:items-center"
            onSubmit={async (event) => {
              if (!bulkAction || selectedCount === 0) {
                event.preventDefault();
                return;
              }

              event.preventDefault();

              if (bulkAction === "delete" && !confirm(`Xóa ${selectedCount} người dùng đã chọn?`)) {
                return;
              }

              try {
                const result = await postForm(ROUTES.API.ADMIN.USERS.BULK, new FormData(event.currentTarget));
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
              <input key={row.id} type="hidden" name="userIds" value={row.original.id} />
            ))}
            <span className="text-sm text-muted-foreground">Đã chọn {selectedCount}</span>
            <select
              name="bulkAction"
              value={bulkAction}
              onChange={(event) => setBulkAction(event.target.value)}
              className="h-9 min-w-52 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:ring-1 focus:ring-ring"
            >
              <option value="">Tác vụ hàng loạt</option>
              <option value="admin">admin</option>
              <option value="user">user</option>
              <option value="delete">Delete</option>
            </select>
            <Button type="submit" className="h-9" disabled={!bulkAction || selectedCount === 0}>
              Áp dụng
            </Button>
          </NativeForm>

          {hasFilters ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setGlobalFilter("");
                table.getColumn("role")?.setFilterValue("");
              }}
            >
              <X className="h-4 w-4" />
              Xóa bộ lọc
            </Button>
          ) : null}
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
                  Không có người dùng phù hợp với bộ lọc hiện tại.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(previewUser)} onOpenChange={(open) => !open && setPreviewUserId(null)}>
        <DialogContent>
          {previewUser ? (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle>Chi tiết người dùng</DialogTitle>
                <DialogDescription>Xem các thông tin chính của tài khoản người dùng.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">ID</p>
                  <p className="break-all text-sm text-muted-foreground">{previewUser.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Tên đăng nhập</p>
                  <p className="text-sm text-muted-foreground">{previewUser.username}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Vai trò</p>
                  <p className="text-sm text-muted-foreground">{previewUser.role}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Họ và tên</p>
                  <p className="text-sm text-muted-foreground">{previewUser.fullName || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Tên hiển thị</p>
                  <p className="text-sm text-muted-foreground">{previewUser.displayName || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Số điện thoại</p>
                  <p className="text-sm text-muted-foreground">{previewUser.phone || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Tạo lúc</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(previewUser.createdAt).toISOString().slice(0, 16).replace("T", " ")}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Bio</p>
                <p className="rounded-md border p-3 text-sm text-muted-foreground">{previewUser.bio || "—"}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
