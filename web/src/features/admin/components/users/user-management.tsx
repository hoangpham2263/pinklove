"use client";

import * as React from "react";
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
import { AdminBulkSubmitButton, AdminLinkButton } from "@/features/admin/components/admin-buttons";
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
import { AccountUser, AuthUser } from "@/lib/auth";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { getRoleLabel, isAdminRole, type UserRole, USER_ROLE_OPTIONS } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";
import { VendorPortalCopyButton } from "@/features/admin/components/vendors/vendor-portal-copy-button";

interface UserManagementProps {
  initialUsers: AccountUser[];
  actor: AuthUser;
  returnTo?: string;
  defaultRoleFilter?: UserRole | "";
  showVendorWorkspaceColumn?: boolean;
}

function getAccountStatusLabel(status: AccountUser["accountStatus"]) {
  switch (status) {
    case "blocked":
      return "Blocked";
    case "banned":
      return "Banned";
    case "deleted":
      return "Deleted";
    case "active":
    default:
      return "Active";
  }
}

function getAccountStatusBadgeVariant(status: AccountUser["accountStatus"]): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "blocked":
      return "outline";
    case "banned":
      return "destructive";
    case "deleted":
      return "secondary";
    case "active":
    default:
      return "default";
  }
}

export function UserManagement({
  initialUsers,
  actor,
  returnTo,
  defaultRoleFilter = "",
  showVendorWorkspaceColumn = false,
}: UserManagementProps) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    defaultRoleFilter ? [{ id: "role", value: defaultRoleFilter }] : []
  );
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
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Tên đăng nhập</AdminTableSortButton>
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
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Vai trò</AdminTableSortButton>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>(columnId) === filterValue;
        },
        cell: ({ row }) => (
          <Badge variant={isAdminRole(row.original.role) ? "default" : "secondary"}>
            {getRoleLabel(row.original.role)}
          </Badge>
        ),
      },
      {
        accessorKey: "accountStatus",
        header: () => <span>Trạng thái</span>,
        cell: ({ row }) => (
          <div className="space-y-1">
            <Badge variant={getAccountStatusBadgeVariant(row.original.accountStatus)}>
              {getAccountStatusLabel(row.original.accountStatus)}
            </Badge>
            {row.original.accountStatusReason ? (
              <p className="max-w-[220px] text-xs text-muted-foreground">{row.original.accountStatusReason}</p>
            ) : null}
          </div>
        ),
      },
      ...(showVendorWorkspaceColumn
        ? [{
            id: "vendorWorkspace",
            enableSorting: false,
            enableColumnFilter: false,
            header: () => <span>Workspace</span>,
            cell: ({ row }: { row: { original: AccountUser } }) => {
              const user = row.original;
              const vendorPortalSlug = user.vendorPortalSlug || "";

              if (!vendorPortalSlug) {
                return <span className="text-sm text-muted-foreground">Chưa có workspace</span>;
              }

              return (
                <div className="flex flex-wrap items-center gap-2">
                  <VendorPortalCopyButton
                    label="Xem thông tin"
                    path={ROUTES.PARTNER.PORTAL(vendorPortalSlug)}
                    username={user.username}
                    password="12313"
                  />
                  <AdminLinkButton href={ROUTES.PARTNER.PORTAL(vendorPortalSlug)}>Portal Link</AdminLinkButton>
                  <AdminLinkButton href={ROUTES.ADMIN.VENDOR(user.id)}>Quản lý đơn riêng</AdminLinkButton>
                </div>
              );
            },
          } satisfies ColumnDef<AccountUser>]
        : []),
      {
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => {
          const user = row.original;
          const isSelf = user.id === actor.id;

          return (
            <AdminTableActions>
              <AdminTableActionButton action="view" label="Xem người dùng" onClick={() => setPreviewUserId(user.id)} />
              <AdminTableActionButton
                action="edit"
                label="Sửa thông tin"
                href={returnTo ? `${ROUTES.ADMIN.USERS}/${user.id}?returnTo=${encodeURIComponent(returnTo)}` : `${ROUTES.ADMIN.USERS}/${user.id}`}
              />

              <NativeForm
                action={adminApiActions.deleteUser}
                method="POST"
                className="inline-block"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!confirm(`Bạn có chắc chắn muốn xóa người dùng: ${user.username}?`)) {
                    return;
                  }

                  try {
                    const result = await adminApi.deleteUser(new FormData(event.currentTarget));
                    toast.success(result.message ?? "Đã xóa tài khoản.");
                    finishMutation(router, result, { redirect: false });
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Không thể xóa tài khoản.");
                  }
                }}
              >
                {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
                <input type="hidden" name="userId" value={String(user.id)} />
                <AdminTableActionButton action="delete" label={isSelf ? "Không thể tự xóa bản thân" : "Xóa tài khoản"} type="submit" disabled={isSelf} />
              </NativeForm>
            </AdminTableActions>
          );
        },
      },
    ],
    [actor.id, returnTo, router, showVendorWorkspaceColumn]
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
      return [user.username, user.role, getRoleLabel(user.role)]
        .concat(user.accountStatus, getAccountStatusLabel(user.accountStatus), user.accountStatusReason)
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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <AdminTableToolbar>
          <AdminTableSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Tìm theo tên đăng nhập hoặc vai trò..." />
          <AdminTableSelect
            value={roleFilterValue}
            label="Lọc vai trò"
            onChange={(value) => table.getColumn("role")?.setFilterValue(value)}
            options={[
              { value: "", label: "Tất cả vai trò" },
              ...USER_ROLE_OPTIONS.map((role) => ({ value: role.value, label: getRoleLabel(role.value) })),
            ]}
          />
          <AdminTableClearButton
            visible={hasFilters}
            onClick={() => {
              setGlobalFilter("");
              table.getColumn("role")?.setFilterValue("");
            }}
          />
        </AdminTableToolbar>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <NativeForm
            action={adminApiActions.bulkUpdateUsers}
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
                const result = await adminApi.bulkUpdateUsers(new FormData(event.currentTarget));
                toast.success(result.message ?? "Đã áp dụng tác vụ hàng loạt.");
                finishMutation(router, result, { redirect: false });
                setRowSelection({});
                setBulkAction("");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Không thể áp dụng tác vụ hàng loạt.");
              }
            }}
          >
            {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
            {selectedRows.map((row) => (
              <input key={row.id} type="hidden" name="userIds" value={row.original.id} />
            ))}
            <span className="text-sm text-muted-foreground">Đã chọn {selectedCount}</span>
            <select
              name="bulkAction"
              value={bulkAction}
              onChange={(event) => setBulkAction(event.target.value)}
              className="h-9 min-w-52 rounded-lg border border-input bg-background px-3 text-sm outline-none"
            >
              <option value="">Tác vụ hàng loạt</option>
              {USER_ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  Đổi sang {getRoleLabel(role.value)}
                </option>
              ))}
              <option value="delete">Delete</option>
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
                  <TableHead key={header.id} className="font-medium">
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
                  <p className="text-sm">ID</p>
                  <p className="break-all text-sm text-muted-foreground">{previewUser.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Tên đăng nhập</p>
                  <p className="text-sm text-muted-foreground">{previewUser.username}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Vai trò</p>
                  <p className="text-sm text-muted-foreground">
                    {getRoleLabel(previewUser.role)} ({previewUser.role})
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Họ và tên</p>
                  <p className="text-sm text-muted-foreground">{previewUser.fullName || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Tên hiển thị</p>
                  <p className="text-sm text-muted-foreground">{previewUser.displayName || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Số điện thoại</p>
                  <p className="text-sm text-muted-foreground">{previewUser.phone || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Tạo lúc</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(previewUser.createdAt).toISOString().slice(0, 16).replace("T", " ")}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm">Bio</p>
                <p className="rounded-md border p-3 text-sm text-muted-foreground">{previewUser.bio || "—"}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
