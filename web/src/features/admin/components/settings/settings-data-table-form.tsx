"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, X } from "lucide-react";
import { toast } from "sonner";
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
import { NativeForm } from "@/components/common/native-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { MediaSelector } from "@/features/media/components/media-selector";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends import("@tanstack/react-table").RowData, TValue> {
    className?: string;
  }
}

type SettingsRow = {
  id: string;
  label: string;
  description: string;
  type: "boolean" | "text" | "textarea" | "select" | "media";
  value: boolean | string;
  options?: Array<{
    label: string;
    value: string;
  }>;
};

type SettingsDataTableFormProps = {
  section: "breadcrumb" | "sitemap" | "indexing" | "branding" | "opengraph" | "favicon" | "ecommerce" | "email";
  title: string;
  rows: SettingsRow[];
  saveMessage: string;
  compactDescription?: boolean;
  columnWidths?: {
    label?: string;
    description?: string;
    value?: string;
  };
};

export function SettingsDataTableForm({
  section,
  title,
  rows: initialRows,
  saveMessage,
  compactDescription = false,
  columnWidths,
}: SettingsDataTableFormProps) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const columns = useMemo<ColumnDef<SettingsRow>[]>(
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
            Setting
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        meta: {
          className: columnWidths?.label,
        },
        cell: ({ row }) => <span className="text-foreground">{row.original.label}</span>,
      },
      {
        accessorKey: "description",
        header: () => <span>Description</span>,
        meta: {
          className: columnWidths?.description ?? (compactDescription ? "w-px" : undefined),
        },
        cell: ({ row }) => (
          <p className={`text-muted-foreground ${compactDescription ? "max-w-none" : ""}`}>{row.original.description}</p>
        ),
      },
      {
        accessorKey: "value",
        header: () => <span>Value</span>,
        meta: {
          className: columnWidths?.value ?? (compactDescription ? "w-full" : undefined),
        },
        cell: ({ row }) => {
          const item = row.original;

          if (item.type === "boolean") {
            return (
              <div className="inline-flex items-center gap-3">
                <input
                  type="hidden"
                  name={item.id}
                  value={Boolean(item.value) ? "on" : ""}
                />
                <Switch
                  checked={Boolean(item.value)}
                  onCheckedChange={(checked) => {
                    setRows((prev) =>
                      prev.map((entry) =>
                        entry.id === item.id ? { ...entry, value: checked } : entry
                      )
                    );
                  }}
                  aria-label={item.label}
                />
                <span>{Boolean(item.value) ? "On" : "Off"}</span>
              </div>
            );
          }

          if (item.type === "textarea") {
            return (
              <textarea
                name={item.id}
                value={String(item.value)}
                onChange={(event) => {
                  const next = event.target.value;
                  setRows((prev) =>
                    prev.map((entry) => (entry.id === item.id ? { ...entry, value: next } : entry))
                  );
                }}
                className="min-h-32 w-full rounded-md border bg-background px-3 py-2"
              />
            );
          }

          if (item.type === "select") {
            return (
              <select
                name={item.id}
                value={String(item.value)}
                onChange={(event) => {
                  const next = event.target.value;
                  setRows((prev) =>
                    prev.map((entry) => (entry.id === item.id ? { ...entry, value: next } : entry))
                  );
                }}
                className="h-9 w-full rounded-md border bg-background px-3"
              >
                {(item.options ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            );
          }

          if (item.type === "media") {
            return (
              <MediaSelector
                name={item.id}
                value={String(item.value)}
                onChange={(next) => {
                  setRows((prev) =>
                    prev.map((entry) => (entry.id === item.id ? { ...entry, value: next } : entry))
                  );
                }}
              />
            );
          }

          return (
            <Input
              name={item.id}
              value={String(item.value)}
              onChange={(event) => {
                const next = event.target.value;
                setRows((prev) =>
                  prev.map((entry) => (entry.id === item.id ? { ...entry, value: next } : entry))
                );
              }}
              className="h-9"
            />
          );
        },
      },
    ],
    [columnWidths?.description, columnWidths?.label, columnWidths?.value, compactDescription]
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
      return [row.original.label, row.original.description]
        .some((value) => value.toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const hasFilters = globalFilter.trim().length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData(event.currentTarget);
      for (const row of rows) {
        if (row.type === "boolean") {
          formData.set(row.id, Boolean(row.value) ? "on" : "");
          continue;
        }

        formData.set(row.id, String(row.value));
      }
      formData.append("section", section);
      const result = await adminApi.updateConfig(formData);
      toast.success(result.message ?? saveMessage);
      finishMutation(router, result, { redirect: false, refresh: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Không thể lưu ${title}.`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <NativeForm action={adminApiActions.updateConfig} method="POST" className="space-y-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="grid gap-3 md:grid-cols-[minmax(0,320px)]">
          <Input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder={`Tìm trong ${title.toLowerCase()}...`}
            className="h-9"
          />
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {hasFilters ? (
            <Button variant="outline" size="sm" onClick={() => setGlobalFilter("")} type="button">
              <X className="h-4 w-4" />
              Xóa bộ lọc
            </Button>
          ) : null}
          <Button type="submit" className="h-9" disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu cài đặt"}
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={header.column.columnDef.meta?.className as string | undefined}>
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
                    <TableCell key={cell.id} className={cell.column.columnDef.meta?.className as string | undefined}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Không có cấu hình nào phù hợp.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </NativeForm>
  );
}
