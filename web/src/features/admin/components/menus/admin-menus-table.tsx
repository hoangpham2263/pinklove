"use client";

import { useMemo, useState } from "react";

import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

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
import { AdminTableClearButton, AdminTableSearch, AdminTableToolbar, AdminTableSortButton } from "@/features/admin/components/admin-table-controls";
import type { Menu } from "@/lib/menu";
import { ROUTES } from "@/lib/routes";

type MenuRow = Omit<Menu, "items">;

type AdminMenusTableProps = {
  menus: MenuRow[];
};

export function AdminMenusTable({ menus }: AdminMenusTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [previewMenuId, setPreviewMenuId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<MenuRow>[]>(
    () => [
      {
        accessorKey: "label",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Tên menu</AdminTableSortButton>
        ),
        cell: ({ row }) => <span>{row.original.label}</span>,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Slug</AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <code>{row.original.name}</code>
        ),
      },
      {
        accessorKey: "itemCount",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Số mục</AdminTableSortButton>
        ),
        cell: ({ row }) => <div className="font-medium">{row.original.itemCount ?? 0}</div>,
      },
      {
        id: "actions",
        enableSorting: false,
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => (
          <AdminTableActions>
            <AdminTableActionButton action="view" label="Xem menu" onClick={() => setPreviewMenuId(row.original.id)} />
            <AdminTableActionButton action="edit" label="Sửa menu" href={ROUTES.ADMIN.MENU(row.original.name)} />
          </AdminTableActions>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: menus,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const keyword = String(filterValue).trim().toLowerCase();
      if (!keyword) return true;

      const menu = row.original;
      return [menu.label, menu.name, menu.itemCount]
        .filter((value) => value !== undefined && value !== null)
        .some((value) => String(value).toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const hasFilters = globalFilter.trim().length > 0;
  const previewMenu = previewMenuId ? menus.find((menu) => menu.id === previewMenuId) ?? null : null;

  return (
    <div className="space-y-4">
      <AdminTableToolbar>
        <AdminTableSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Tìm theo tên menu, slug..." />
        <AdminTableClearButton visible={hasFilters} onClick={() => setGlobalFilter("")} />
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
                  Không có menu phù hợp với bộ lọc hiện tại.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(previewMenu)} onOpenChange={(open) => !open && setPreviewMenuId(null)}>
        <DialogContent>
          {previewMenu ? (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle>Chi tiết menu</DialogTitle>
                <DialogDescription>Xem thông tin cơ bản của menu điều hướng.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Tên menu</p>
                  <p className="text-sm text-muted-foreground">{previewMenu.label}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Slug</p>
                  <p className="text-sm text-muted-foreground">{previewMenu.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">ID</p>
                  <p className="break-all text-sm text-muted-foreground">{previewMenu.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Số mục</p>
                  <p className="text-sm text-muted-foreground">{previewMenu.itemCount ?? 0}</p>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
