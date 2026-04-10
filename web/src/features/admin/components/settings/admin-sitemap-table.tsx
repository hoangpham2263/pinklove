"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, ExternalLink, Eye, X } from "lucide-react";
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
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Group
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <span className="font-medium">{row.original.label}</span>,
      },
      {
        accessorKey: "routePath",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Path
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <code>{row.original.routePath}</code>
        ),
      },
      {
        accessorKey: "count",
        header: ({ column }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Links
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => <div className="text-right font-medium">{row.original.count}</div>,
      },
      {
        accessorKey: "enabled",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="h-4 w-4" />
          </Button>
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
          <div className="flex justify-end gap-2">
            {row.original.enabled ? (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => setPreviewKey(row.original.key)}>
                  <Eye className="h-4 w-4" />
                  Xem
                </Button>
                <Link
                  href={row.original.routePath}
                  target="_blank"
                  title="Open sitemap XML"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">N/A</span>
            )}
          </div>
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
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 md:grid-cols-[minmax(0,320px)_220px]">
            <Input
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Tìm theo group hoặc path..."
              className="h-9"
            />

            <select
              value={statusFilterValue}
              onChange={(event) => table.getColumn("enabled")?.setFilterValue(event.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Active</option>
              <option value="false">Disabled</option>
            </select>
          </div>

          {hasFilters ? (
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                setGlobalFilter("");
                table.getColumn("enabled")?.setFilterValue("");
              }}
            >
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

              <div className="min-h-0 flex-1 overflow-auto px-6 pb-6">
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
                  <Input
                    value={previewFilter}
                    onChange={(event) => setPreviewFilter(event.target.value)}
                    placeholder="Tìm theo URL hoặc last modified..."
                    className="h-9"
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
