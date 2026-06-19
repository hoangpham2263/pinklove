"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
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
import {
  AdminCancelButton,
  AdminCreateButton,
  AdminSubmitButton,
} from "@/features/admin/components/admin-buttons";
import {
  AdminTableActionButton,
  AdminTableActions,
} from "@/features/admin/components/admin-table-actions";
import {
  AdminTableClearButton,
  AdminTableSearch,
  AdminTableSelect,
  AdminTableSortButton,
  AdminTableToolbar,
} from "@/features/admin/components/admin-table-controls";
import { finishMutation, postForm } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";
import type { SeoRedirectRule } from "@/lib/seo-redirects";

type RedirectDraft = {
  id: string;
  label: string;
  sourcePath: string;
  targetPath: string;
  statusCode: "301" | "302";
  enabled: boolean;
};

const EMPTY_DRAFT: RedirectDraft = {
  id: "",
  label: "",
  sourcePath: "",
  targetPath: "",
  statusCode: "301",
  enabled: true,
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SeoRedirectsManager({ rules }: { rules: SeoRedirectRule[] }) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [draft, setDraft] = useState<RedirectDraft>(EMPTY_DRAFT);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreate = useCallback(() => {
    setDraft(EMPTY_DRAFT);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((rule: SeoRedirectRule) => {
    setDraft({
      id: rule.id,
      label: rule.label,
      sourcePath: rule.sourcePath,
      targetPath: rule.targetPath,
      statusCode: String(rule.statusCode) as "301" | "302",
      enabled: rule.enabled,
    });
    setDialogOpen(true);
  }, []);

  const deleteRule = useCallback(async (rule: SeoRedirectRule) => {
    if (!confirm(`Xóa redirect từ ${rule.sourcePath}?`)) return;
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
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Ghi chú
          </AdminTableSortButton>
        ),
        cell: ({ row }) => row.original.label || <span className="text-muted-foreground">—</span>,
      },
      {
        accessorKey: "sourcePath",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Source
          </AdminTableSortButton>
        ),
        cell: ({ row }) => <code className="text-xs">{row.original.sourcePath}</code>,
      },
      {
        accessorKey: "targetPath",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Target
          </AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <Link
            href={row.original.targetPath}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-80 items-center gap-2 text-primary hover:underline"
          >
            <span className="truncate">{row.original.targetPath}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </Link>
        ),
      },
      {
        accessorKey: "statusCode",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Mã
          </AdminTableSortButton>
        ),
        cell: ({ row }) => <Badge variant="secondary">{row.original.statusCode}</Badge>,
      },
      {
        accessorKey: "enabled",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Trạng thái
          </AdminTableSortButton>
        ),
        filterFn: (row, columnId, value) => !value || row.getValue<boolean>(columnId) === (value === "active"),
        cell: ({ row }) => (
          <Badge variant={row.original.enabled ? "default" : "secondary"}>
            {row.original.enabled ? "Active" : "Disabled"}
          </Badge>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Cập nhật
          </AdminTableSortButton>
        ),
        cell: ({ row }) => formatDate(row.original.updatedAt),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => (
          <AdminTableActions>
            <AdminTableActionButton action="edit" label="Sửa redirect" onClick={() => openEdit(row.original)} />
            <AdminTableActionButton
              action="delete"
              label="Xóa redirect"
              disabled={deletingId === row.original.id}
              onClick={() => deleteRule(row.original)}
            />
          </AdminTableActions>
        ),
      },
    ],
    [deleteRule, deletingId, openEdit]
  );

  const table = useReactTable({
    data: rules,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, value) => {
      const keyword = String(value).trim().toLowerCase();
      if (!keyword) return true;
      const rule = row.original;
      return [rule.label, rule.sourcePath, rule.targetPath, String(rule.statusCode)]
        .some((item) => item.toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const statusFilter = (table.getColumn("enabled")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters = globalFilter.trim().length > 0 || statusFilter.length > 0;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("enabled", draft.enabled ? "on" : "");
      const result = await postForm(ROUTES.API.ADMIN.CONFIG.REDIRECTS_SAVE, formData);
      toast.success(result.message ?? "Đã lưu redirect.");
      setDialogOpen(false);
      setDraft(EMPTY_DRAFT);
      finishMutation(router, result, { redirect: false, refresh: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu redirect.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <AdminTableToolbar>
            <AdminTableSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Tìm source, target, ghi chú..." />
            <AdminTableSelect
              value={statusFilter}
              label="Lọc trạng thái"
              onChange={(value) => table.getColumn("enabled")?.setFilterValue(value)}
              options={[
                { value: "", label: "Tất cả trạng thái" },
                { value: "active", label: "Active" },
                { value: "disabled", label: "Disabled" },
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

          <AdminCreateButton type="button" onClick={openCreate}>
            Thêm redirect
          </AdminCreateButton>
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
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    Không có redirect phù hợp.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Chỉnh sửa SEO Redirect" : "Tạo SEO Redirect"}</DialogTitle>
            <DialogDescription>
              Redirect được áp dụng khi source path không khớp route hoặc nội dung canonical hiện tại.
            </DialogDescription>
          </DialogHeader>

          <form action={ROUTES.API.ADMIN.CONFIG.REDIRECTS_SAVE} method="POST" className="space-y-4" onSubmit={handleSave}>
            <input type="hidden" name="id" value={draft.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm">Ghi chú</span>
                <Input name="label" value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} />
              </label>
              <label className="space-y-2">
                <span className="text-sm">Source path</span>
                <Input name="sourcePath" value={draft.sourcePath} onChange={(event) => setDraft({ ...draft, sourcePath: event.target.value })} placeholder="/duong-dan-cu" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm">Target</span>
                <Input name="targetPath" value={draft.targetPath} onChange={(event) => setDraft({ ...draft, targetPath: event.target.value })} placeholder="/duong-dan-moi" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm">HTTP status</span>
                <select
                  name="statusCode"
                  value={draft.statusCode}
                  onChange={(event) => setDraft({ ...draft, statusCode: event.target.value as "301" | "302" })}
                  className="h-9 w-full rounded-md border bg-background px-3"
                >
                  <option value="301">301 Permanent</option>
                  <option value="302">302 Temporary</option>
                </select>
              </label>
              <div className="flex items-end">
                <label className="inline-flex h-9 items-center gap-3 rounded-md border px-3">
                  <Switch checked={draft.enabled} onCheckedChange={(enabled) => setDraft({ ...draft, enabled })} />
                  <span className="text-sm">{draft.enabled ? "Active" : "Disabled"}</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <AdminCancelButton onClick={() => setDialogOpen(false)}>Hủy</AdminCancelButton>
              <AdminSubmitButton disabled={isSaving}>
                {isSaving ? "Đang lưu..." : draft.id ? "Lưu thay đổi" : "Tạo redirect"}
              </AdminSubmitButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
