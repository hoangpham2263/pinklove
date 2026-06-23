"use client";

import { useEffect, useMemo, useState } from "react";

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
import { AdminTableActionButton, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import { AdminBulkSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminTableClearButton, AdminTableSearch, AdminTableSelect, AdminTableToolbar, AdminTableSortButton } from "@/features/admin/components/admin-table-controls";
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
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { getRoleLabel } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";
import type { AdminNotification, NotificationAudienceType, NotificationStatus } from "@/features/notifications/types";
import { AdminNotificationUpsertDialog } from "@/features/notifications/components/admin-notification-upsert-dialog";
import type { UserRole } from "@/lib/roles";

type AccountOption = {
  id: string;
  accountName: string;
  role: UserRole;
};

type RoleOption = {
  value: UserRole;
  label: string;
};

type AdminNotificationsTableProps = {
  notifications: AdminNotification[];
  accounts: AccountOption[];
  roles: RoleOption[];
  statusOptions?: NotificationStatus[];
  hideStatusFilter?: boolean;
  emptyMessage?: string;
};

function getAudienceLabel(audienceType: NotificationAudienceType) {
  if (audienceType === "role") {
    return "Theo role";
  }

  if (audienceType === "users") {
    return "Cá nhân";
  }

  return "Toàn bộ";
}

function getStatusLabel(status: NotificationStatus) {
  if (status === "sent") {
    return "Sent";
  }

  if (status === "scheduled") {
    return "Scheduled";
  }

  if (status === "archived") {
    return "Archived";
  }

  return "Draft";
}

function getStatusVariant(status: NotificationStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "sent") {
    return "default";
  }

  if (status === "archived") {
    return "outline";
  }

  return "secondary";
}

function formatDateTime(value: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.hour ?? "00"}:${values.minute ?? "00"} ${values.day ?? "00"}/${values.month ?? "00"}/${values.year ?? "0000"}`;
}

function isInteractiveElement(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("button, a, input, select, textarea, [role='button']"));
}

export function AdminNotificationsTable({
  notifications,
  accounts,
  roles,
  statusOptions = ["draft", "scheduled", "sent", "archived"],
  hideStatusFilter = false,
  emptyMessage = "Không có thông báo phù hợp với bộ lọc hiện tại.",
}: AdminNotificationsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkAction, setBulkAction] = useState("");
  const [previewNotificationId, setPreviewNotificationId] = useState<string | null>(null);
  const [tableNotifications, setTableNotifications] = useState(notifications);

  useEffect(() => {
    setTableNotifications(notifications);
  }, [notifications]);

  const columns = useMemo<ColumnDef<AdminNotification>[]>(
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
            aria-label={`Select ${row.original.title}`}
            className="h-4 w-4 rounded border border-input"
            checked={row.getIsSelected()}
            onChange={(event) => row.toggleSelected(event.target.checked)}
          />
        ),
      },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Tiêu đề</AdminTableSortButton>
        ),
        cell: ({ row }) => <p className="whitespace-normal break-words">{row.original.title}</p>,
      },
      {
        accessorKey: "audienceType",
        header: "Đối tượng",
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>(columnId) === filterValue;
        },
        cell: ({ row }) => (
          <div className="min-w-28">
            <Badge variant="secondary">{getAudienceLabel(row.original.audienceType)}</Badge>
          </div>
        ),
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
          <Badge variant={getStatusVariant(row.original.status)}>
            {getStatusLabel(row.original.status)}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Tạo lúc</AdminTableSortButton>
        ),
        cell: ({ row }) => <span>{formatDateTime(row.original.createdAt)}</span>,
      },
      {
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => {
          const notification = row.original;

          return (
            <AdminTableActions>
              <AdminTableActionButton
                action="view"
                label="Xem thông báo"
                onClick={() => setPreviewNotificationId(notification.id)}
              />
              <AdminNotificationUpsertDialog
                accounts={accounts}
                roles={roles}
                notification={notification}
                triggerLabel="Sửa thông báo"
                triggerVariant="outline"
                iconOnly
              />
              <NativeForm
                action={adminApiActions.deleteNotification}
                method="POST"
                className="inline-block"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!confirm(`Bạn có chắc chắn muốn xóa thông báo: ${notification.title}?`)) {
                    return;
                  }

                  try {
                    const result = await adminApi.deleteNotification(new FormData(event.currentTarget));
                    setTableNotifications((current) => current.filter((item) => item.id !== notification.id));
                    setPreviewNotificationId((current) => (current === notification.id ? null : current));
                    setRowSelection((current) => {
                      const next = { ...current };
                      delete next[notification.id];
                      return next;
                    });
                    toast.success(result.message ?? "Đã xóa thông báo.");
                    finishMutation(router, result, { redirect: false });
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Không thể xóa thông báo.");
                  }
                }}
              >
                <input type="hidden" name="id" value={notification.id} />
                <input type="hidden" name="returnTo" value={ROUTES.ADMIN.NOTIFICATIONS} />
                <AdminTableActionButton type="submit" action="delete" label="Xóa thông báo" />
              </NativeForm>
            </AdminTableActions>
          );
        },
      },
    ],
    [accounts, roles, router]
  );

  const table = useReactTable({
    data: tableNotifications,
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

      const notification = row.original;
      return [
        notification.title,
        notification.body,
        notification.linkUrl,
        notification.status,
        notification.audienceType,
        notification.createdByUsername,
        ...notification.roles,
        ...notification.targetUsers.map((user) => user.accountName),
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
  const audienceFilterValue = (table.getColumn("audienceType")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters =
    globalFilter.trim().length > 0 || (!hideStatusFilter && statusFilterValue.length > 0) || audienceFilterValue.length > 0;
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const previewNotification = previewNotificationId
    ? tableNotifications.find((notification) => notification.id === previewNotificationId) ?? null
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <AdminTableToolbar>
          <AdminTableSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Tìm theo tiêu đề, người tạo, role, accountName..." />
          {hideStatusFilter ? null : (
            <AdminTableSelect
              value={statusFilterValue}
              label="Lọc trạng thái"
              onChange={(value) => table.getColumn("status")?.setFilterValue(value)}
              options={[
                { value: "", label: "Tất cả trạng thái" },
                ...statusOptions.map((status) => ({ value: status, label: getStatusLabel(status) })),
              ]}
            />
          )}
          <AdminTableSelect
            value={audienceFilterValue}
            label="Lọc đối tượng"
            onChange={(value) => table.getColumn("audienceType")?.setFilterValue(value)}
            options={[
              { value: "", label: "Tất cả đối tượng" },
              { value: "all", label: "Toàn bộ" },
              { value: "role", label: "Theo role" },
              { value: "users", label: "Cá nhân" },
            ]}
          />
          <AdminTableClearButton
            visible={hasFilters}
            onClick={() => {
              setGlobalFilter("");
              if (!hideStatusFilter) {
                table.getColumn("status")?.setFilterValue("");
              }
              table.getColumn("audienceType")?.setFilterValue("");
            }}
          />
        </AdminTableToolbar>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <select
              value={bulkAction}
              onChange={(event) => setBulkAction(event.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-white px-3 outline-none md:w-44"
            >
              <option value="">Tác vụ hàng loạt</option>
              <option value="sent">Mark as sent</option>
              <option value="draft">Move to draft</option>
              <option value="archived">Archive</option>
              <option value="delete">Xóa</option>
            </select>
            <AdminBulkSubmitButton
              type="button"
              className="md:min-w-24"
              disabled={!bulkAction || selectedCount === 0}
              onClick={async () => {
                if (!bulkAction || selectedCount === 0) {
                  return;
                }

                if (bulkAction === "delete" && !confirm(`Xóa ${selectedCount} thông báo đã chọn?`)) {
                  return;
                }

                const formData = new FormData();
                selectedRows.forEach((row) => {
                  formData.append("ids", row.original.id);
                });
                formData.append("returnTo", ROUTES.ADMIN.NOTIFICATIONS);
                formData.append("bulkAction", bulkAction);

                try {
                  const selectedIds = selectedRows.map((row) => row.original.id);
                  const result = await adminApi.bulkUpdateNotifications(formData);
                  if (bulkAction === "delete") {
                    const selectedIdSet = new Set(selectedIds);
                    setTableNotifications((current) => current.filter((item) => !selectedIdSet.has(item.id)));
                    setPreviewNotificationId((current) => (current && selectedIdSet.has(current) ? null : current));
                  } else if (bulkAction === "sent" || bulkAction === "draft" || bulkAction === "archived") {
                    setTableNotifications((current) =>
                      current.map((item) => (selectedIds.includes(item.id) ? { ...item, status: bulkAction } : item))
                    );
                  }
                  toast.success(result.message ?? "Đã áp dụng tác vụ hàng loạt.");
                  finishMutation(router, result, { redirect: false });
                  setRowSelection({});
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Không thể áp dụng tác vụ hàng loạt.");
                } finally {
                  setBulkAction("");
                }
              }}
            >
              Áp dụng
            </AdminBulkSubmitButton>
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="align-middle whitespace-normal break-words">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className="cursor-pointer"
                  onClick={(event) => {
                    if (isInteractiveElement(event.target)) {
                      return;
                    }

                    row.toggleSelected();
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="align-middle whitespace-normal break-words">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <span>Đã chọn {selectedCount}</span>
      </div>

      <Dialog open={Boolean(previewNotification)} onOpenChange={(open) => !open && setPreviewNotificationId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {previewNotification ? (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle>Chi tiết thông báo</DialogTitle>
                <DialogDescription>Xem đầy đủ nội dung và cấu hình phát hành.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Tiêu đề</p>
                  <p>{previewNotification.title}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Trạng thái</p>
                  <p>{getStatusLabel(previewNotification.status)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Đối tượng</p>
                  <p>{getAudienceLabel(previewNotification.audienceType)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Người tạo</p>
                  <p>{previewNotification.createdByUsername}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Link điều hướng</p>
                  <p>{previewNotification.linkUrl || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Lịch gửi</p>
                  <p>{formatDateTime(previewNotification.scheduledAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Tạo lúc</p>
                  <p>{formatDateTime(previewNotification.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Cập nhật lúc</p>
                  <p>{formatDateTime(previewNotification.updatedAt)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Nội dung</p>
                <div className="rounded-lg border bg-muted/20 p-4">
                  {previewNotification.body || "Không có nội dung"}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Người nhận</p>
                <div className="flex flex-wrap gap-2">
                  {previewNotification.audienceType === "all" ? (
                    <Badge variant="secondary">Tất cả người dùng</Badge>
                  ) : null}
                  {previewNotification.roles.map((role) => (
                    <Badge key={role} variant="secondary">{getRoleLabel(role)}</Badge>
                  ))}
                  {previewNotification.targetUsers.map((user) => (
                    <Badge key={user.id} variant="secondary">{user.accountName}</Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
