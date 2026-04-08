"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Eye, Pencil, Trash2, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/lib/routes";
import type { Product, ProductType } from "@/features/products/types";

type AdminProductListProps = {
  products: Product[];
  search: string;
  status: "" | Product["status"];
  productType: "" | ProductType;
  title?: string;
};

export function AdminProductList({
  products,
  search,
  status,
  productType,
  title,
}: AdminProductListProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    ...(status ? [{ id: "status", value: status }] : []),
    ...(productType ? [{ id: "productType", value: productType }] : []),
  ]);
  const [globalFilter, setGlobalFilter] = useState(search);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkAction, setBulkAction] = useState("");

  const columns = useMemo<ColumnDef<Product>[]>(
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
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tên sản phẩm
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-semibold">{product.name}</span>
              {product.excerpt ? (
                <span className="text-muted-foreground line-clamp-2 text-xs">{product.excerpt}</span>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "slug",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Slug / Template
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <code className="relative w-fit rounded bg-muted px-[5px] py-[3px] font-mono text-sm">
              /{row.original.slug}
            </code>
            <span className="text-muted-foreground text-xs">{row.original.templateKey}</span>
          </div>
        ),
      },
      {
        accessorKey: "productType",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Loại
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>(columnId) === filterValue;
        },
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.original.productType === "builder_template" ? "Builder Template" : "Coded Template"}
          </Badge>
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
        cell: ({ row }) => (
          <Badge variant={row.original.status === "published" ? "default" : "secondary"}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "price",
        header: ({ column }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Giá
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => <div className="text-right font-medium">{row.original.price}</div>,
      },
      {
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => {
          const product = row.original;
          const publicHref =
            product.productType === "builder_template" ? `/builder/${product.slug}` : `/templates/${product.slug}`;

          return (
            <div className="flex justify-end gap-2">
              <Link
                href={publicHref}
                target="_blank"
                title="Xem ngoài site"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent"
              >
                <Eye className="h-4 w-4" />
              </Link>
              <Link
                href={ROUTES.ADMIN.PRODUCT(product.slug)}
                title="Chỉnh sửa"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Pencil className="h-4 w-4" />
              </Link>
              <NativeForm
                action={ROUTES.API.ADMIN.PRODUCTS.DELETE}
                method="POST"
                className="inline-block"
                onSubmit={(event) => {
                  if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm: ${product.name}?`)) {
                    event.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="slug" value={product.slug} />
                <Button
                  type="submit"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 border border-destructive/50"
                  title="Xóa sản phẩm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </NativeForm>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: products,
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

      const product = row.original;
      return [
        product.name,
        product.slug,
        product.templateKey,
        product.status,
        product.productType,
        product.excerpt,
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
  const typeFilterValue = (table.getColumn("productType")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters =
    globalFilter.trim().length > 0 || statusFilterValue.length > 0 || typeFilterValue.length > 0;
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  return (
    <div className="space-y-4">
      {title ? <h2 className="text-xl font-semibold tracking-tight">{title}</h2> : null}

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid gap-3 md:grid-cols-[minmax(0,320px)_220px_220px]">
          <Input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Tìm theo tên, slug, template key..."
            className="h-9"
          />
          <select
            value={statusFilterValue}
            onChange={(event) => table.getColumn("status")?.setFilterValue(event.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:ring-1 focus:ring-ring"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <select
            value={typeFilterValue}
            onChange={(event) => table.getColumn("productType")?.setFilterValue(event.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:ring-1 focus:ring-ring"
          >
            <option value="">Tất cả loại</option>
            <option value="coded_template">Coded Template</option>
            <option value="builder_template">Builder Template</option>
          </select>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <NativeForm
            action={ROUTES.API.ADMIN.PRODUCTS.BULK}
            method="POST"
            className="flex flex-col gap-3 md:flex-row md:items-center"
            onSubmit={(event) => {
              if (!bulkAction || selectedCount === 0) {
                event.preventDefault();
                return;
              }

              if (bulkAction === "delete" && !confirm(`Xóa ${selectedCount} sản phẩm đã chọn?`)) {
                event.preventDefault();
              }
            }}
          >
            {selectedRows.map((row) => (
              <input key={row.id} type="hidden" name="slugs" value={row.original.slug} />
            ))}
            <span className="text-muted-foreground text-sm">
              Đã chọn {selectedCount}
            </span>
            <select
              name="bulkAction"
              value={bulkAction}
              onChange={(event) => setBulkAction(event.target.value)}
              className="h-9 min-w-52 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:ring-1 focus:ring-ring"
            >
              <option value="">Tác vụ hàng loạt</option>
              <option value="publish">Published</option>
              <option value="draft">Draft</option>
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
                table.getColumn("status")?.setFilterValue("");
                table.getColumn("productType")?.setFilterValue("");
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
                  Không có sản phẩm phù hợp với bộ lọc hiện tại.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
