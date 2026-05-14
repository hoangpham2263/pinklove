"use client";

import { useMemo, useState } from "react";
import { Cable, CheckCircle2, Database, Layers3, ShieldOff } from "lucide-react";
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
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { WebsiteHook } from "@/features/website-hooks/catalog";
import { WEBSITE_HOOKS } from "@/features/website-hooks/catalog";
import { cn } from "@/lib/utils";

type AdminHooksCatalogProps = {
  hooks: WebsiteHook[];
};

export function AdminHooksCatalog({ hooks }: AdminHooksCatalogProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [previewHookKey, setPreviewHookKey] = useState<string | null>(null);

  const scopeCount = new Set(hooks.map((hook) => hook.scope)).size;
  const payloadFieldCount = hooks.reduce((sum, hook) => sum + hook.payloadKeys.length, 0);
  const activeCount = hooks.filter((hook) => hook.status === "active").length;
  const inactiveCount = hooks.length - activeCount;
  const scopeOptions = useMemo(() => Array.from(new Set(hooks.map((hook) => hook.scope))).sort(), [hooks]);

  const columns = useMemo<ColumnDef<WebsiteHook>[]>(
    () => [
      {
        accessorKey: "label",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Hook</AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium">{row.original.label}</p>
            <p className="text-sm text-muted-foreground">{row.original.key}</p>
          </div>
        ),
      },
      {
        accessorKey: "scope",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Scope</AdminTableSortButton>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>(columnId) === filterValue;
        },
        cell: ({ row }) => <Badge variant="secondary">{row.original.scope}</Badge>,
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Status</AdminTableSortButton>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>(columnId) === filterValue;
        },
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                row.original.status === "active" ? "bg-emerald-500" : "bg-red-500"
              )}
            />
            <Badge variant="outline" className={row.original.status === "active" ? "text-emerald-600" : "text-red-600"}>
              {row.original.statusLabel}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: "triggerSource",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Trigger</AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <code className="text-sm">{row.original.triggerSource}</code>
            <p className="text-xs text-muted-foreground">
              {row.original.payloadKeys.length} field payload
            </p>
          </div>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => (
          <AdminTableActions>
            <AdminTableActionButton
              action="view"
              label="Xem hook"
              onClick={() => setPreviewHookKey(row.original.key)}
            />
          </AdminTableActions>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: hooks,
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

      return [
        row.original.key,
        row.original.label,
        row.original.scope,
        row.original.status,
        row.original.statusReason,
        row.original.description,
        row.original.triggerSource,
        ...row.original.payloadKeys,
      ].some((value) => value.toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.key,
  });

  const scopeFilterValue = (table.getColumn("scope")?.getFilterValue() as string | undefined) ?? "";
  const statusFilterValue = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters =
    globalFilter.trim().length > 0 || scopeFilterValue.length > 0 || statusFilterValue.length > 0;
  const previewHook = previewHookKey ? hooks.find((hook) => hook.key === previewHookKey) ?? null : null;

  return (
    <section className="flex w-full flex-1 flex-col gap-5">
      <AdminOverviewGrid className="lg:grid-cols-5">
        <AdminOverviewCard title="Total Hooks" value={hooks.length} icon={Cable} />
        <AdminOverviewCard title="Scopes" value={scopeCount} icon={Layers3} />
        <AdminOverviewCard title="Active" value={activeCount} icon={CheckCircle2} />
        <AdminOverviewCard title="Inactive" value={inactiveCount} icon={ShieldOff} />
        <AdminOverviewCard title="Payload Fields" value={payloadFieldCount} icon={Database} />
      </AdminOverviewGrid>

      <Card className="rounded-lg">
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle>Hook Catalog</CardTitle>
              <p className="text-muted-foreground">
                Catalog này là inventory các action point hiện có của website để dùng làm bề mặt đồng bộ ra hệ thống ngoài.
              </p>
            </div>
            <div className="w-full text-sm text-muted-foreground md:w-auto">
              {table.getFilteredRowModel().rows.length} / {hooks.length} hook
            </div>
          </div>

          <AdminTableToolbar>
            <AdminTableSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Tìm hook, trigger, payload..." />
            <AdminTableSelect
              value={scopeFilterValue}
              label="Lọc scope"
              onChange={(value) => table.getColumn("scope")?.setFilterValue(value)}
              options={[
                { value: "", label: "Tất cả scope" },
                ...scopeOptions.map((scope) => ({ value: scope, label: scope })),
              ]}
            />
            <AdminTableSelect
              value={statusFilterValue}
              label="Lọc trạng thái"
              onChange={(value) => table.getColumn("status")?.setFilterValue(value)}
              options={[
                { value: "", label: "Tất cả trạng thái" },
                { value: "active", label: "Đang dùng" },
                { value: "inactive", label: "Legacy / Inactive" },
              ]}
            />
            <AdminTableClearButton
              visible={hasFilters}
              onClick={() => {
                setGlobalFilter("");
                table.getColumn("scope")?.setFilterValue("");
                table.getColumn("status")?.setFilterValue("");
              }}
            />
          </AdminTableToolbar>
        </CardHeader>
        <CardContent className="space-y-4">
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
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      Không có hook nào khớp bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <Cable className="mt-0.5 h-5 w-5 text-primary" />
              <div className="space-y-1">
                <p className="font-medium">Integration-ready catalog</p>
                <p className="text-muted-foreground">
                  Hook xanh là action point đang có route thật. Hook đỏ là alias legacy hoặc route không còn là chuẩn chính để tích hợp mới.
                </p>
              </div>
            </div>
          </div>

          <Dialog open={Boolean(previewHook)} onOpenChange={(open) => !open && setPreviewHookKey(null)}>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              {previewHook ? (
                <div className="space-y-6">
                  <DialogHeader>
                    <DialogTitle>Chi tiết hook</DialogTitle>
                    <DialogDescription>Xem thông tin kỹ thuật cần thiết cho hook đang chọn.</DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Tên hook</p>
                      <p className="text-sm text-muted-foreground">{previewHook.label}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Key</p>
                      <p className="break-all text-sm text-muted-foreground">{previewHook.key}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Scope</p>
                      <p className="text-sm text-muted-foreground">{previewHook.scope}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Direction</p>
                      <p className="text-sm text-muted-foreground">{previewHook.direction}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-sm text-muted-foreground">
                        {previewHook.statusLabel} ({previewHook.status})
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Trigger source</p>
                      <p className="text-sm text-muted-foreground">{previewHook.triggerSource}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium">Mô tả</p>
                    <p className="rounded-md border p-3 text-sm text-muted-foreground">{previewHook.description}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium">Lý do trạng thái</p>
                    <p className="rounded-md border p-3 text-sm text-muted-foreground">{previewHook.statusReason}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Payload keys</p>
                    <div className="flex flex-wrap gap-2 rounded-md border p-3">
                      {previewHook.payloadKeys.map((key) => (
                        <Badge key={key} variant="outline">
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </section>
  );
}

export const adminHookCatalogSeed = WEBSITE_HOOKS;
