"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminTableActionButton, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import { AdminTableClearButton, AdminTableSearch, AdminTableSelect, AdminTableToolbar, AdminTableSortButton } from "@/features/admin/components/admin-table-controls";
import { type AffiliateApplication } from "@/features/affiliate/types";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";

type AdminAffiliateApplicationsTableProps = {
  applications: AffiliateApplication[];
};

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

function getExternalHref(value?: string) {
  if (!value) return "";
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  return `https://${value}`;
}

export function AdminAffiliateApplicationsTable({ applications }: AdminAffiliateApplicationsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowEdits, setRowEdits] = useState<
    Record<string, { status: AffiliateApplication["reviewStatus"]; reviewNote: string }>
  >({});
  const [previewApplicationId, setPreviewApplicationId] = useState<string | null>(null);

  function getRowEdit(application: AffiliateApplication) {
    return rowEdits[application.id] ?? {
      status: application.reviewStatus,
      reviewNote: application.reviewNote ?? "",
    };
  }

  function updateRowEdit(applicationId: string, next: Partial<(typeof rowEdits)[string]>) {
    setRowEdits((current) => ({
      ...current,
      [applicationId]: {
        status: current[applicationId]?.status ?? applications.find((item) => item.id === applicationId)?.reviewStatus ?? "pending_review",
        reviewNote: current[applicationId]?.reviewNote ?? applications.find((item) => item.id === applicationId)?.reviewNote ?? "",
        ...next,
      },
    }));
  }

  const columns: ColumnDef<AffiliateApplication>[] = [
    {
      accessorKey: "fullName",
      header: ({ column }) => (
        <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Người đăng ký</AdminTableSortButton>
      ),
      cell: ({ row }) => (
        <div className="space-y-1">
          <p>{row.original.fullName}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
          <p className="text-xs text-muted-foreground">{row.original.phone}</p>
        </div>
      ),
    },
    {
      accessorKey: "preferredCode",
      header: "Mã mong muốn",
      cell: ({ row }) => <code>{row.original.preferredCode || "—"}</code>,
    },
    {
      accessorKey: "city",
      header: "Khu vực",
      cell: ({ row }) => row.original.city || "—",
    },
    {
      accessorKey: "reviewStatus",
      header: ({ column }) => (
        <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Trạng thái</AdminTableSortButton>
      ),
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true;
        return row.getValue<string>(columnId) === filterValue;
      },
      cell: ({ row }) => {
        const draft = getRowEdit(row.original);
        return (
          <select
            value={draft.status}
            onChange={(event) => updateRowEdit(row.original.id, { status: event.target.value as AffiliateApplication["reviewStatus"] })}
            className="h-8 w-full rounded-md border bg-background px-2 text-sm"
          >
            <option value="pending_review">pending_review</option>
            <option value="contacted">contacted</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="archived">archived</option>
          </select>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Gửi lúc",
      cell: ({ row }) => formatDateTime(row.original.createdAt),
    },
    {
      id: "notes",
      header: "Ghi chú review",
      cell: ({ row }) => {
        const draft = getRowEdit(row.original);
        return (
          <textarea
            value={draft.reviewNote}
            onChange={(event) => updateRowEdit(row.original.id, { reviewNote: event.target.value })}
            rows={3}
            className="min-w-52 rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors"
          />
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Hành động</div>,
      cell: ({ row }) => {
        const draft = getRowEdit(row.original);
        const channelHref = getExternalHref(row.original.channelLink);
        return (
          <AdminTableActions>
            <AdminTableActionButton action="view" label="Xem hồ sơ" onClick={() => setPreviewApplicationId(row.original.id)} />
            {channelHref ? (
              <AdminTableActionButton action="external" label="Mở kênh" href={channelHref} target="_blank" />
            ) : null}
            <NativeForm
              action={adminApiActions.updateAffiliateApplication}
              method="POST"
              onSubmit={async (event) => {
                event.preventDefault();
                try {
                  const result = await adminApi.updateAffiliateApplication(new FormData(event.currentTarget));
                  toast.success(result.message ?? "Đã cập nhật hồ sơ affiliate.");
                  finishMutation(router, result, { redirect: false });
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Không thể cập nhật hồ sơ affiliate.");
                }
              }}
            >
              <input type="hidden" name="applicationId" value={row.original.id} />
              <input type="hidden" name="status" value={draft.status} />
              <input type="hidden" name="reviewNote" value={draft.reviewNote} />
              <AdminTableActionButton action="save" label="Lưu hồ sơ" type="submit" />
            </NativeForm>
          </AdminTableActions>
        );
      },
    },
  ];

  const table = useReactTable({
    data: applications,
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
      const application = row.original;
      return [
        application.fullName,
        application.email,
        application.phone,
        application.preferredCode,
        application.city,
        application.reviewStatus,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const statusFilterValue = (table.getColumn("reviewStatus")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters = globalFilter.trim().length > 0 || statusFilterValue.length > 0;
  const previewApplication = previewApplicationId ? applications.find((application) => application.id === previewApplicationId) ?? null : null;

  return (
    <>
    <div className="space-y-4">
      <AdminTableToolbar>
        <AdminTableSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Tìm theo tên, email, mã mong muốn..." />
        <AdminTableSelect
          value={statusFilterValue}
          label="Lọc trạng thái"
          onChange={(value) => table.getColumn("reviewStatus")?.setFilterValue(value)}
          options={[
            { value: "", label: "Tất cả trạng thái" },
            { value: "pending_review", label: "pending_review" },
            { value: "contacted", label: "contacted" },
            { value: "approved", label: "approved" },
            { value: "rejected", label: "rejected" },
            { value: "archived", label: "archived" },
          ]}
        />
        <AdminTableClearButton
          visible={hasFilters}
          onClick={() => {
            setGlobalFilter("");
            table.getColumn("reviewStatus")?.setFilterValue("");
          }}
        />
      </AdminTableToolbar>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-medium">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="align-top">
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
                  Chưa có hồ sơ affiliate từ khách chưa đăng nhập.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
    <Dialog open={Boolean(previewApplication)} onOpenChange={(open) => !open && setPreviewApplicationId(null)}>
      <DialogContent>
        {previewApplication ? (
          <>
            <DialogHeader>
              <DialogTitle>{previewApplication.fullName}</DialogTitle>
              <DialogDescription>Thông tin đăng ký affiliate từ khách chưa đăng nhập.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="break-all text-sm">{previewApplication.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Số điện thoại</p>
                <p className="text-sm">{previewApplication.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Mã mong muốn</p>
                <p className="text-sm">{previewApplication.preferredCode || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Khu vực</p>
                <p className="text-sm">{previewApplication.city || "-"}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs text-muted-foreground">Kênh</p>
                <p className="break-all text-sm">{previewApplication.channelLink || "-"}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs text-muted-foreground">Audience note</p>
                <p className="whitespace-pre-wrap rounded-md border p-3 text-sm">{previewApplication.audienceNote || "-"}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs text-muted-foreground">Ghi chú</p>
                <p className="whitespace-pre-wrap rounded-md border p-3 text-sm">{previewApplication.notes || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Trạng thái review</p>
                <p className="text-sm">{previewApplication.reviewStatus}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Gửi lúc</p>
                <p className="text-sm">{formatDateTime(previewApplication.createdAt)}</p>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
    </>
  );
}
