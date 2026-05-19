"use client";

import { useCallback, useMemo, useState } from "react";
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

import { Badge } from "@/components/ui/badge";
import { NativeForm } from "@/components/common/native-form";
import { AdminBulkSubmitButton } from "@/features/admin/components/admin-buttons";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { getManagedPagePath } from "@/lib/page-paths";
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
import type { ManagedPage } from "@/lib/managed-pages";

type AdminPagesTableProps = {
  pages: ManagedPage[];
  emptyMessage: string;
};

export function AdminPagesTable({ pages, emptyMessage }: AdminPagesTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkAction, setBulkAction] = useState("");

  const handleAdminCheckedChange = useCallback(async (page: ManagedPage, checked: boolean) => {
    const formData = new FormData();
    formData.set("bulkAction", checked ? "admin_used" : "admin_unused");
    formData.append("slugs", page.slug);

    try {
      const result = await adminApi.bulkUpdatePages(formData);
      toast.success(result.message ?? "Đã cập nhật đánh dấu quản lý.");
      finishMutation(router, result, { redirect: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật đánh dấu quản lý.");
    }
  }, [router]);

  const columns = useMemo<ColumnDef<ManagedPage>[]>(
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
            Tiêu đề</AdminTableSortButton>
        ),
        cell: ({ row }) => {
          const page = row.original;
          return <span>{page.name}</span>;
        },
      },
      {
        accessorKey: "slug",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Slug (Đường dẫn)</AdminTableSortButton>
        ),
        cell: ({ row }) => <code>{getManagedPagePath(row.original)}</code>,
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
          const page = row.original;
          return (
            <Badge variant={page.status === "published" ? "default" : "secondary"}>
              {page.status || "draft"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "adminUsed",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Đã sử dụng</AdminTableSortButton>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          const value = Boolean(row.getValue<boolean>(columnId));
          return filterValue === "checked" ? value : !value;
        },
        cell: ({ row }) => {
          const page = row.original;
          return (
            <input
              type="checkbox"
              aria-label={`Đánh dấu đã sử dụng ${page.name}`}
              className="h-4 w-4 cursor-pointer rounded border border-input"
              checked={Boolean(page.adminUsed)}
              onChange={(event) => {
                void handleAdminCheckedChange(page, event.target.checked);
              }}
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
          const page = row.original;
          const targetUrl = getManagedPagePath(page);

          return (
            <AdminTableActions>
              <AdminTableActionButton action="external" label="Xem trang" href={targetUrl} target="_blank" />
              <AdminTableActionButton action="edit" label="Sửa trang" href={`/admin/pages/${page.slug}`} />
            </AdminTableActions>
          );
        },
      },
    ],
    [handleAdminCheckedChange]
  );

  const table = useReactTable({
    data: pages,
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

      const page = row.original;
      const adminUsedLabel = page.adminUsed ? "đã sử dụng used checked done" : "chưa sử dụng unused unchecked todo";
      return [page.name, page.title, page.slug, page.status, adminUsedLabel]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.slug,
    enableRowSelection: true,
  });

  const statusFilterValue = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "";
  const adminUsedFilterValue = (table.getColumn("adminUsed")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters = globalFilter.trim().length > 0 || statusFilterValue.length > 0 || adminUsedFilterValue.length > 0;
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <AdminTableToolbar contentClassName="grid w-full grid-cols-1 md:grid-cols-[minmax(0,1fr)_10.5rem_10.5rem_auto] lg:w-auto">
          <AdminTableSearch
            value={globalFilter}
            onChange={setGlobalFilter}
            placeholder="Tìm theo tiêu đề, slug, trạng thái..."
            className="md:w-full"
          />
          <AdminTableSelect
            value={statusFilterValue}
            label="Lọc trạng thái"
            className="md:w-full"
            onChange={(value) => table.getColumn("status")?.setFilterValue(value)}
            options={[
              { value: "", label: "Tất cả trạng thái" },
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
            ]}
          />
          <AdminTableSelect
            value={adminUsedFilterValue}
            label="Lọc đánh dấu"
            className="md:w-full"
            onChange={(value) => table.getColumn("adminUsed")?.setFilterValue(value)}
            options={[
              { value: "", label: "Tất cả đánh dấu" },
              { value: "checked", label: "Đã sử dụng" },
              { value: "unchecked", label: "Chưa sử dụng" },
            ]}
          />
          <AdminTableClearButton
            visible={hasFilters}
            onClick={() => {
              setGlobalFilter("");
              table.getColumn("status")?.setFilterValue("");
              table.getColumn("adminUsed")?.setFilterValue("");
            }}
          />
        </AdminTableToolbar>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <NativeForm
            action={adminApiActions.bulkUpdatePages}
            method="POST"
            className="flex flex-col gap-3 md:flex-row md:items-center"
            onSubmit={async (event) => {
              if (!bulkAction || selectedCount === 0) {
                event.preventDefault();
                return;
              }

              event.preventDefault();

              try {
                const formData = new FormData(event.currentTarget);
                formData.set("bulkAction", bulkAction);
                const result = await adminApi.bulkUpdatePages(formData);
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
            <span className="text-sm text-muted-foreground">Đã chọn {selectedCount}</span>
            <select
              name="bulkAction"
              value={bulkAction}
              onChange={(event) => setBulkAction(event.target.value)}
              className="h-9 min-w-52 rounded-lg border border-input bg-background px-3 text-sm outline-none"
            >
              <option value="">Tác vụ hàng loạt</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="admin_used">Đánh dấu đã sử dụng</option>
              <option value="admin_unused">Bỏ đánh dấu đã sử dụng</option>
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
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
