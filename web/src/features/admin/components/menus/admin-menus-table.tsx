"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Eye, Pencil, X } from "lucide-react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

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
import type { Menu } from "@/lib/menu";

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
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tên menu
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <span>{row.original.label}</span>,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Slug
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <code>{row.original.name}</code>
        ),
      },
      {
        accessorKey: "itemCount",
        header: ({ column }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Số mục
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => <div className="text-right font-medium">{row.original.itemCount ?? 0}</div>,
      },
      {
        id: "actions",
        enableSorting: false,
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPreviewMenuId(row.original.id)}>
              <Eye className="h-4 w-4" />
              Xem
            </Button>
            <Link
              href={`/admin/menus/${row.original.id}`}
              title="Sửa menu"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          </div>
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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-3 md:grid-cols-[minmax(0,320px)]">
          <Input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Tìm theo tên menu, slug..."
            className="h-9"
          />
        </div>

        {hasFilters ? (
          <Button variant="outline" size="sm" onClick={() => setGlobalFilter("")}>
            <X className="h-4 w-4" />
            Xóa bộ lọc
          </Button>
        ) : null}
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
