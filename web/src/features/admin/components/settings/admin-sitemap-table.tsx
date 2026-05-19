"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

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
import { AdminTableActionButton, AdminTableActions } from "@/features/admin/components/admin-table-actions";
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

export type AdminSitemapRow = {
  key: string;
  label: string;
  routePath: string;
  sitemapUrl: string;
  enabled: boolean;
  count: number;
  items: {
    loc: string;
    lastmod?: string;
  }[];
};

type AdminSitemapTableProps = {
  rows: AdminSitemapRow[];
};

export function AdminSitemapTable({ rows }: AdminSitemapTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [previewFilter, setPreviewFilter] = useState("");

  const columns = useMemo<ColumnDef<AdminSitemapRow>[]>(
    () => [
      {
        accessorKey: "label",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Group</AdminTableSortButton>
        ),
        cell: ({ row }) => <span className="font-medium">{row.original.label}</span>,
      },
      {
        accessorKey: "routePath",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Path</AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <code>{row.original.routePath}</code>
        ),
      },
      {
        accessorKey: "count",
        header: ({ column }) => (
          <div className="text-right">
            <AdminTableSortButton align="right" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Links</AdminTableSortButton>
          </div>
        ),
        cell: ({ row }) => <div className="text-right font-medium">{row.original.count}</div>,
      },
      {
        accessorKey: "enabled",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Status</AdminTableSortButton>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return String(row.getValue(columnId)) === filterValue;
        },
        cell: ({ row }) => (
          <Badge className={row.original.enabled ? "text-emerald-600" : "text-muted-foreground"}>
            {row.original.enabled ? "active" : "disabled"}
          </Badge>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <AdminTableActions>
            {row.original.enabled ? (
              <>
                <AdminTableActionButton
                  action="view"
                  label="Xem sitemap"
                  onClick={() => setPreviewKey(row.original.key)}
                />
                <AdminTableActionButton
                  action="external"
                  href={row.original.routePath}
                  target="_blank"
                  label="Open sitemap XML"
                />
              </>
            ) : (
              <span className="text-sm text-muted-foreground">N/A</span>
            )}
          </AdminTableActions>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: rows,
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

      return [row.original.label, row.original.routePath]
        .some((value) => value.toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const statusFilterValue = (table.getColumn("enabled")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters = globalFilter.trim().length > 0 || statusFilterValue.length > 0;
  const previewRow = previewKey ? rows.find((row) => row.key === previewKey) ?? null : null;
  const previewItems = previewRow
    ? previewRow.items.filter((item) => {
        const keyword = previewFilter.trim().toLowerCase();
        if (!keyword) return true;
        return [item.loc, item.lastmod ?? ""].some((value) => value.toLowerCase().includes(keyword));
      })
    : [];

  return (
    <>
      <div className="space-y-4">
        <AdminTableToolbar>
          <AdminTableSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Tìm theo group hoặc path..." />
          <AdminTableSelect
            value={statusFilterValue}
            label="Lọc trạng thái"
            onChange={(value) => table.getColumn("enabled")?.setFilterValue(value)}
            options={[
              { value: "", label: "Tất cả trạng thái" },
              { value: "true", label: "Active" },
              { value: "false", label: "Disabled" },
            ]}
          />
          <AdminTableClearButton
            visible={hasFilters}
            onClick={() => {
              setGlobalFilter("");
              table.getColumn("enabled")?.setFilterValue("");
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
                  <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                    Không có sitemap group nào phù hợp.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog
        open={Boolean(previewRow)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewKey(null);
            setPreviewFilter("");
          }
        }}
      >
        <DialogContent className="flex max-h-[85vh] max-w-5xl flex-col overflow-hidden p-0">
          {previewRow ? (
            <>
              <DialogHeader className="shrink-0 px-6 pt-6">
                <DialogTitle>{previewRow.label}</DialogTitle>
                <DialogDescription>
                  {previewRow.routePath} • {previewRow.count} URLs
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6">
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/30 p-3 text-sm">
                  <span className="text-muted-foreground">Realtime URL:</span>
                  <Link
                    href={previewRow.sitemapUrl}
                    target="_blank"
                    className="break-all font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {previewRow.sitemapUrl}
                  </Link>
                </div>

                <div className="mt-4">
                  <AdminTableSearch
                    value={previewFilter}
                    onChange={setPreviewFilter}
                    placeholder="Tìm theo URL hoặc last modified..."
                  />
                </div>

                <div className="mt-4 rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>URL</TableHead>
                        <TableHead>Last Modified</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewItems.length ? (
                        previewItems.map((item) => (
                          <TableRow key={item.loc}>
                            <TableCell className="max-w-[560px] truncate">
                              <Link href={item.loc} target="_blank" className="text-primary underline-offset-4 hover:underline">
                                {item.loc}
                              </Link>
                            </TableCell>
                            <TableCell>{item.lastmod ?? "-"}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="h-24 text-center text-sm text-muted-foreground">
                            Không có URL nào phù hợp.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
