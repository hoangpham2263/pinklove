"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, Eye, Pencil, X } from "lucide-react";
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
import { type AffiliateAccount } from "@/features/affiliate/types";
import { finishMutation, postForm } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";

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
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tài khoản
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <span>{row.original.username}</span>,
      },
      {
        accessorKey: "code",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Mã
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <code>{row.original.code}</code>
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
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Commission
            <ArrowUpDown className="h-4 w-4" />
          </Button>
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
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Giá trị
            <ArrowUpDown className="h-4 w-4" />
          </Button>
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
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPreviewAccountId(account.userId)}>
                <Eye className="h-4 w-4" />
                Xem
              </Button>

              <NativeForm
                action={ROUTES.API.ADMIN.AFFILIATES.UPDATE}
                method="POST"
                onSubmit={async (event) => {
                  event.preventDefault();

                  try {
                    const result = await postForm(ROUTES.API.ADMIN.AFFILIATES.UPDATE, new FormData(event.currentTarget));
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
                <Button type="submit" variant="outline" size="sm">
                  <Pencil className="h-4 w-4" />
                  Lưu
                </Button>
              </NativeForm>
            </div>
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
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid gap-3 md:grid-cols-[minmax(0,320px)_220px]">
          <Input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Tìm theo username, mã ref, trạng thái..."
            className="h-9"
          />
          <select
            value={statusFilterValue}
            onChange={(event) => table.getColumn("status")?.setFilterValue(event.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:ring-1 focus:ring-ring"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">pending</option>
            <option value="active">active</option>
            <option value="rejected">rejected</option>
            <option value="blocked">blocked</option>
          </select>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <NativeForm
            action={ROUTES.API.ADMIN.AFFILIATES.BULK}
            method="POST"
            className="flex flex-col gap-3 md:flex-row md:items-center"
            onSubmit={async (event) => {
              if (!bulkAction || selectedCount === 0) {
                event.preventDefault();
                return;
              }

              event.preventDefault();

              try {
                const result = await postForm(ROUTES.API.ADMIN.AFFILIATES.BULK, new FormData(event.currentTarget));
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
              className="h-9 min-w-52 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:ring-1 focus:ring-ring"
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

          {hasFilters ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setGlobalFilter("");
                table.getColumn("status")?.setFilterValue("");
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
                  <p className="text-sm font-medium">Tài khoản</p>
                  <p className="text-sm text-muted-foreground">{previewAccount.username}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Mã</p>
                  <p className="text-sm text-muted-foreground">{previewAccount.code}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Trạng thái</p>
                  <p className="text-sm text-muted-foreground">{previewDraft.status}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Commission</p>
                  <p className="text-sm text-muted-foreground">{previewDraft.commissionType}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Giá trị</p>
                  <p className="text-sm text-muted-foreground">{previewDraft.commissionValue}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Click</p>
                  <p className="text-sm text-muted-foreground">{previewAccount.clickCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Conversion</p>
                  <p className="text-sm text-muted-foreground">{previewAccount.conversionCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Earned</p>
                  <p className="text-sm text-muted-foreground">{previewAccount.earnedCommission}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Duyệt bởi</p>
                  <p className="text-sm text-muted-foreground">{previewAccount.approvedByUsername || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Duyệt lúc</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(previewAccount.approvedAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Tạo lúc</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(previewAccount.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Cập nhật lúc</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(previewAccount.updatedAt)}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Ghi chú</p>
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
