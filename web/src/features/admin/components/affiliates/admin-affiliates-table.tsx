"use client";

import { useState } from "react";
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
import { AdminTableActionButton, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import { AdminTableClearButton, AdminTableSearch, AdminTableSelect, AdminTableToolbar, AdminTableSortButton } from "@/features/admin/components/admin-table-controls";
import { type AffiliateAccount } from "@/features/affiliate/types";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";

type AdminAffiliatesTableProps = {
  accounts: AffiliateAccount[];
};

function formatDateTime(value?: string) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toISOString().slice(0, 16).replace("T", " ");
}

export function AdminAffiliatesTable({ accounts }: AdminAffiliatesTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkAction, setBulkAction] = useState("");
  const [previewAccountId, setPreviewAccountId] = useState<string | null>(null);
  const [rowEdits, setRowEdits] = useState<
    Record<
      string,
      {
        status: string;
        commissionType: string;
        commissionValue: string;
      }
    >
  >({});

  function getRowEdit(account: AffiliateAccount) {
    return (
      rowEdits[account.userId] ?? {
        status: account.status,
        commissionType: account.commissionType,
        commissionValue: String(account.commissionValue),
      }
    );
  }

  function updateRowEdit(userId: string, next: Partial<(typeof rowEdits)[string]>) {
    setRowEdits((current) => {
      const existing = current[userId] ?? {
        status: accounts.find((account) => account.userId === userId)?.status ?? "pending",
        commissionType: accounts.find((account) => account.userId === userId)?.commissionType ?? "percent",
        commissionValue: String(accounts.find((account) => account.userId === userId)?.commissionValue ?? 0),
      };

      return {
        ...current,
        [userId]: {
          ...existing,
          ...next,
        },
      };
    });
  }

  const columns: ColumnDef<AffiliateAccount>[] = [
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
            onChange={(event) => row.toggleSelected(event.target.checked)}
          />
        ),
      },
      {
        accessorKey: "username",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Tài khoản</AdminTableSortButton>
        ),
        cell: ({ row }) => <span>{row.original.username}</span>,
      },
      {
        accessorKey: "code",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Mã</AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <code>{row.original.code}</code>
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
        cell: ({ row }) => {
          const account = row.original;
          const draft = getRowEdit(account);

          return (
            <select
              value={draft.status}
              onChange={(event) => updateRowEdit(account.userId, { status: event.target.value })}
              className="h-8 w-full rounded-md border bg-background px-2 text-sm"
            >
                <option value="pending">pending</option>
                <option value="active">active</option>
                <option value="rejected">rejected</option>
                <option value="blocked">blocked</option>
            </select>
          );
        },
      },
      {
        accessorKey: "commissionType",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Commission</AdminTableSortButton>
        ),
        cell: ({ row }) => {
          const account = row.original;
          const draft = getRowEdit(account);

          return (
            <select
              value={draft.commissionType}
              onChange={(event) => updateRowEdit(account.userId, { commissionType: event.target.value })}
              className="h-8 w-full rounded-md border bg-background px-2 text-sm"
            >
              <option value="percent">percent</option>
              <option value="fixed">fixed</option>
            </select>
          );
        },
      },
      {
        accessorKey: "commissionValue",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Giá trị</AdminTableSortButton>
        ),
        cell: ({ row }) => {
          const account = row.original;
          const draft = getRowEdit(account);

          return (
            <Input
              value={draft.commissionValue}
              onChange={(event) => updateRowEdit(account.userId, { commissionValue: event.target.value })}
              className="h-8 w-20 min-w-20"
              type="number"
              min="0"
              step="0.01"
            />
          );
        },
      },
      {
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => {
          const account = row.original;
          const draft = getRowEdit(account);

          return (
            <AdminTableActions>
              <AdminTableActionButton action="view" label="Xem affiliate" onClick={() => setPreviewAccountId(account.userId)} />

              <NativeForm
                action={adminApiActions.updateAffiliate}
                method="POST"
                onSubmit={async (event) => {
                  event.preventDefault();

                  try {
                    const result = await adminApi.updateAffiliate(new FormData(event.currentTarget));
                    toast.success(result.message ?? "Đã cập nhật cấu hình affiliate.");
                    finishMutation(router, result, { redirect: false });
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Không thể cập nhật affiliate lúc này.");
                  }
                }}
              >
                <input type="hidden" name="userId" value={account.userId} />
                <input type="hidden" name="status" value={draft.status} />
                <input type="hidden" name="commissionType" value={draft.commissionType} />
                <input type="hidden" name="commissionValue" value={draft.commissionValue} />
                <input type="hidden" name="notes" value={account.notes || ""} />
                <AdminTableActionButton action="save" label="Lưu affiliate" type="submit" />
              </NativeForm>
            </AdminTableActions>
          );
        },
      },
  ];

  const table = useReactTable({
    data: accounts,
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

      const account = row.original;
      return [account.username, account.code, account.status, account.commissionType]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.userId,
    enableRowSelection: true,
  });

  const statusFilterValue = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters = globalFilter.trim().length > 0 || statusFilterValue.length > 0;
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const previewAccount = previewAccountId
    ? accounts.find((account) => account.userId === previewAccountId) ?? null
    : null;
  const previewDraft = previewAccount ? getRowEdit(previewAccount) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <AdminTableToolbar>
          <AdminTableSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Tìm theo username, mã ref, trạng thái..." />
          <AdminTableSelect
            value={statusFilterValue}
            label="Lọc trạng thái"
            onChange={(value) => table.getColumn("status")?.setFilterValue(value)}
            options={[
              { value: "", label: "Tất cả trạng thái" },
              { value: "pending", label: "pending" },
              { value: "active", label: "active" },
              { value: "rejected", label: "rejected" },
              { value: "blocked", label: "blocked" },
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
            action={adminApiActions.bulkUpdateAffiliates}
            method="POST"
            className="flex flex-col gap-3 md:flex-row md:items-center"
            onSubmit={async (event) => {
              if (!bulkAction || selectedCount === 0) {
                event.preventDefault();
                return;
              }

              event.preventDefault();

              try {
                const result = await adminApi.bulkUpdateAffiliates(new FormData(event.currentTarget));
                toast.success(result.message ?? "Đã cập nhật tài khoản affiliate.");
                finishMutation(router, result, { redirect: false });
                setRowSelection({});
                setBulkAction("");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Không thể cập nhật affiliate lúc này.");
              }
            }}
          >
            {selectedRows.map((row) => (
              <input key={row.id} type="hidden" name="userIds" value={row.original.userId} />
            ))}
            <span className="text-sm text-muted-foreground">Đã chọn {selectedCount}</span>
            <select
              name="bulkAction"
              value={bulkAction}
              onChange={(event) => setBulkAction(event.target.value)}
              className="h-9 min-w-52 rounded-lg border border-input bg-background px-3 text-sm outline-none"
            >
              <option value="">Tác vụ hàng loạt</option>
              <option value="pending">pending</option>
              <option value="active">active</option>
              <option value="rejected">rejected</option>
              <option value="blocked">blocked</option>
            </select>
            <Button type="submit" className="h-9" disabled={!bulkAction || selectedCount === 0}>
              Áp dụng
            </Button>
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
                  Chưa có user nào đăng ký affiliate.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(previewAccount)} onOpenChange={(open) => !open && setPreviewAccountId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {previewAccount && previewDraft ? (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle>Chi tiết affiliate</DialogTitle>
                <DialogDescription>Xem toàn bộ thông tin của tài khoản affiliate.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm">Tài khoản</p>
                  <p className="text-sm text-muted-foreground">{previewAccount.username}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Mã</p>
                  <p className="text-sm text-muted-foreground">{previewAccount.code}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Trạng thái</p>
                  <p className="text-sm text-muted-foreground">{previewDraft.status}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Commission</p>
                  <p className="text-sm text-muted-foreground">{previewDraft.commissionType}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Giá trị</p>
                  <p className="text-sm text-muted-foreground">{previewDraft.commissionValue}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Click</p>
                  <p className="text-sm text-muted-foreground">{previewAccount.clickCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Conversion</p>
                  <p className="text-sm text-muted-foreground">{previewAccount.conversionCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Earned</p>
                  <p className="text-sm text-muted-foreground">{previewAccount.earnedCommission}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Duyệt bởi</p>
                  <p className="text-sm text-muted-foreground">{previewAccount.approvedByUsername || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Duyệt lúc</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(previewAccount.approvedAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Tạo lúc</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(previewAccount.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">Cập nhật lúc</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(previewAccount.updatedAt)}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm">Ghi chú</p>
                <p className="rounded-md border p-3 text-sm text-muted-foreground">
                  {previewAccount.notes || "Không có ghi chú."}
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
