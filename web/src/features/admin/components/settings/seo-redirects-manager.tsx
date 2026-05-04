"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpDown, ExternalLink, Pencil, Plus, Trash2, X } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { finishMutation, postForm } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";
import type { SeoRedirectRule } from "@/lib/system-settings";

type SeoRedirectsManagerProps = {
  rules: SeoRedirectRule[];
};

const emptyDraft = {
  id: "",
  label: "",
  sourcePath: "",
  targetPath: "",
  statusCode: "301",
  enabled: true,
};

type RedirectDraft = typeof emptyDraft;

export function SeoRedirectsManager({ rules }: SeoRedirectsManagerProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [draft, setDraft] = useState<RedirectDraft>(emptyDraft);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function createRule() {
    setDraft(emptyDraft);
    setIsDialogOpen(true);
  }

  const editRule = useCallback((rule: SeoRedirectRule) => {
    setDraft({
      id: rule.id,
      label: rule.label,
      sourcePath: rule.sourcePath,
      targetPath: rule.targetPath,
      statusCode: String(rule.statusCode),
      enabled: rule.enabled,
    });
    setIsDialogOpen(true);
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("enabled", draft.enabled ? "on" : "");
      const result = await postForm(ROUTES.API.ADMIN.CONFIG.REDIRECTS_SAVE, formData);
      toast.success(result.message ?? "Đã lưu redirect.");
      setDraft(emptyDraft);
      setIsDialogOpen(false);
      finishMutation(router, result, { redirect: false, refresh: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu redirect.");
    } finally {
      setIsSaving(false);
    }
  }

  const deleteRule = useCallback(async (rule: SeoRedirectRule) => {
    if (!confirm(`Xóa redirect từ ${rule.sourcePath}?`)) {
      return;
    }

    setDeletingId(rule.id);

    try {
      const formData = new FormData();
      formData.set("id", rule.id);
      const result = await postForm(ROUTES.API.ADMIN.CONFIG.REDIRECTS_DELETE, formData);
      toast.success(result.message ?? "Đã xóa redirect.");
      finishMutation(router, result, { redirect: false, refresh: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa redirect.");
    } finally {
      setDeletingId(null);
    }
  }, [router]);

  const columns = useMemo<ColumnDef<SeoRedirectRule>[]>(
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
            Title
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          row.original.label ? <span>{row.original.label}</span> : <span className="text-muted-foreground">-</span>
        ),
      },
      {
        accessorKey: "sourcePath",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Source
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <code>{row.original.sourcePath}</code>,
      },
      {
        accessorKey: "targetPath",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Target
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <Link
            href={row.original.targetPath}
            target="_blank"
            className="inline-flex max-w-[360px] items-center gap-2 truncate text-primary underline-offset-4 hover:underline"
          >
            <span className="truncate">{row.original.targetPath}</span>
            <ExternalLink className="h-4 w-4 shrink-0" />
          </Link>
        ),
      },
      {
        accessorKey: "statusCode",
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
        cell: ({ row }) => <Badge variant="secondary">{row.original.statusCode}</Badge>,
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
            State
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<boolean>(columnId) === (filterValue === "enabled");
        },
        cell: ({ row }) => (
          <Badge variant={row.original.enabled ? "default" : "secondary"}>
            {row.original.enabled ? "active" : "disabled"}
          </Badge>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => {
          const rule = row.original;

          return (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                className="h-8 w-8"
                aria-label="Sửa redirect"
                title="Sửa redirect"
                onClick={() => editRule(rule)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-8 w-8 border border-destructive/50"
                aria-label="Xóa redirect"
                title="Xóa redirect"
                disabled={deletingId === rule.id}
                onClick={() => deleteRule(rule)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [deletingId, deleteRule, editRule]
  );

  const table = useReactTable({
    data: rules,
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

      const rule = row.original;
      return [
        rule.label,
        rule.sourcePath,
        rule.targetPath,
        String(rule.statusCode),
        rule.enabled ? "active enabled" : "disabled",
      ]
        .some((value) => value.toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const stateFilterValue = (table.getColumn("enabled")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters = globalFilter.trim().length > 0 || stateFilterValue.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-3 md:grid-cols-[minmax(0,320px)_220px]">
          <Input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Tìm theo title, source, target..."
            className="h-9 bg-background"
          />
          <select
            value={stateFilterValue}
            onChange={(event) => table.getColumn("enabled")?.setFilterValue(event.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:ring-1 focus:ring-ring"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="enabled">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {hasFilters ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setGlobalFilter("");
                table.getColumn("enabled")?.setFilterValue("");
              }}
            >
              <X className="h-4 w-4" />
              Xóa bộ lọc
            </Button>
          ) : null}
          <Button type="button" className="h-9" onClick={createRule}>
            <Plus className="h-4 w-4" />
            Thêm redirect
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft.id ? "Cập nhật redirect" : "Thêm redirect"}</DialogTitle>
            <DialogDescription>
              Chuyển một đường dẫn cũ sang trang mới bằng 301 hoặc 302.
            </DialogDescription>
          </DialogHeader>

          <form action={ROUTES.API.ADMIN.CONFIG.REDIRECTS_SAVE} method="POST" className="space-y-4" onSubmit={handleSave}>
            <input type="hidden" name="id" value={draft.id} />
            <input type="hidden" name="enabled" value={draft.enabled ? "on" : ""} />

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span>Label</span>
                <Input
                  name="label"
                  value={draft.label}
                  onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
                  placeholder="Old campaign URL"
                  className="h-9"
                />
              </label>

              <label className="space-y-2">
                <span>Status</span>
                <select
                  name="statusCode"
                  value={draft.statusCode}
                  onChange={(event) => setDraft((current) => ({ ...current, statusCode: event.target.value }))}
                  className="h-9 w-full rounded-md border bg-background px-3"
                >
                  <option value="301">301 Permanent</option>
                  <option value="302">302 Temporary</option>
                </select>
              </label>

              <label className="space-y-2">
                <span>Source Path</span>
                <Input
                  name="sourcePath"
                  value={draft.sourcePath}
                  onChange={(event) => setDraft((current) => ({ ...current, sourcePath: event.target.value }))}
                  placeholder="/link-sai"
                  className="h-9"
                  required
                />
              </label>

              <label className="space-y-2">
                <span>Target Path</span>
                <Input
                  name="targetPath"
                  value={draft.targetPath}
                  onChange={(event) => setDraft((current) => ({ ...current, targetPath: event.target.value }))}
                  placeholder="/trang-can-dua-ve"
                  className="h-9"
                  required
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="inline-flex items-center gap-3">
                <Switch
                  checked={draft.enabled}
                  onCheckedChange={(checked) => setDraft((current) => ({ ...current, enabled: checked }))}
                  aria-label="Enable redirect"
                />
                <span>{draft.enabled ? "Enabled" : "Disabled"}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" className="h-9" onClick={() => setIsDialogOpen(false)}>
                  <X className="h-4 w-4" />
                  Hủy
                </Button>
                <Button type="submit" className="h-9" disabled={isSaving}>
                  <Plus className="h-4 w-4" />
                  {draft.id ? "Cập nhật" : "Thêm redirect"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-background">
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
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Không có redirect phù hợp với bộ lọc hiện tại.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
