"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { toast } from "sonner";

import { NativeForm } from "@/components/common/native-form";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminTableActionButton, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import { AdminTableClearButton, AdminTableSearch, AdminTableSelect, AdminTableToolbar, AdminTableSortButton } from "@/features/admin/components/admin-table-controls";
import { AdminTableView } from "@/features/admin/components/admin-table-view";
import type { ProviderApplication, ProviderApplicationReviewStatus } from "@/features/provider-applications/server/service";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";

const REVIEW_STATUSES: ProviderApplicationReviewStatus[] = [
  "pending_review",
  "contacted",
  "approved",
  "rejected",
  "archived",
];

const STATUS_LABELS: Record<ProviderApplicationReviewStatus, string> = {
  pending_review: "Chờ review",
  contacted: "Đã liên hệ",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  archived: "Lưu trữ",
};

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

function getExternalHref(value?: string) {
  if (!value) return "";
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  return `https://${value}`;
}

function getStatusBadgeVariant(status: ProviderApplicationReviewStatus) {
  if (status === "approved") return "default";
  if (status === "rejected" || status === "archived") return "destructive";
  return "secondary";
}

type RowEdit = {
  status: ProviderApplicationReviewStatus;
  reviewNote: string;
};

type AdminProviderApplicationsTableProps = {
  applications: ProviderApplication[];
};

export function AdminProviderApplicationsTable({ applications }: AdminProviderApplicationsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowEdits, setRowEdits] = useState<Record<string, RowEdit>>({});
  const [previewApplicationId, setPreviewApplicationId] = useState<string | null>(null);

  function getRowEdit(application: ProviderApplication): RowEdit {
    return rowEdits[application.id] ?? {
      status: application.reviewStatus,
      reviewNote: application.reviewNote ?? "",
    };
  }

  function updateRowEdit(applicationId: string, next: Partial<RowEdit>) {
    setRowEdits((current) => {
      const application = applications.find((item) => item.id === applicationId);
      return {
        ...current,
        [applicationId]: {
          status: current[applicationId]?.status ?? application?.reviewStatus ?? "pending_review",
          reviewNote: current[applicationId]?.reviewNote ?? application?.reviewNote ?? "",
          ...next,
        },
      };
    });
  }

  const columns = useMemo<ColumnDef<ProviderApplication>[]>(
    () => [
      {
        accessorKey: "companyName",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Nhà cung cấp</AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium">{row.original.companyName}</p>
            <p className="text-xs text-muted-foreground">{row.original.contactName}</p>
            <p className="text-xs text-muted-foreground">{row.original.phone}</p>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Account</AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium">{row.original.accountName || "Chưa map account"}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
            <p className="text-xs text-muted-foreground">{row.original.accountRole || "-"}</p>
          </div>
        ),
      },
      {
        accessorKey: "city",
        header: "Khu vực",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p>{row.original.city || "-"}</p>
            <p className="max-w-52 truncate text-xs text-muted-foreground" title={row.original.categories || ""}>
              {row.original.categories || "-"}
            </p>
          </div>
        ),
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
        cell: ({ row }) => (
          <Badge variant={getStatusBadgeVariant(row.original.reviewStatus)}>
            {STATUS_LABELS[row.original.reviewStatus]}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Gửi lúc</AdminTableSortButton>
        ),
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "review",
        header: "Review",
        enableSorting: false,
        cell: ({ row }) => {
          const draft = getRowEdit(row.original);
          const canApprove = Boolean(row.original.userId);
          return (
            <div className="min-w-56 space-y-2">
              <select
                value={draft.status}
                onChange={(event) => updateRowEdit(row.original.id, { status: event.target.value as ProviderApplicationReviewStatus })}
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
              >
                {REVIEW_STATUSES.map((status) => (
                  <option key={status} value={status} disabled={status === "approved" && !canApprove}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <Textarea
                value={draft.reviewNote}
                onChange={(event) => updateRowEdit(row.original.id, { reviewNote: event.target.value })}
                rows={2}
                placeholder="Ghi chú admin"
                className="min-h-16 text-sm"
              />
              {!canApprove ? (
                <p className="text-xs text-destructive">Không tìm thấy account để approve.</p>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => {
          const application = row.original;
          const draft = getRowEdit(application);
          const externalHref = getExternalHref(application.website);

          return (
            <AdminTableActions>
              <AdminTableActionButton action="view" label="Xem hồ sơ" onClick={() => setPreviewApplicationId(application.id)} />
              {externalHref ? (
                <AdminTableActionButton action="external" label="Mở kênh" href={externalHref} target="_blank" />
              ) : null}
              <NativeForm
                action={adminApiActions.updateProviderApplication}
                method="POST"
                onSubmit={async (event) => {
                  event.preventDefault();
                  try {
                    const result = await adminApi.updateProviderApplication(new FormData(event.currentTarget));
                    toast.success(result.message ?? "Đã cập nhật hồ sơ provider.");
                    finishMutation(router, result, { redirect: false });
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Không thể cập nhật hồ sơ provider.");
                  }
                }}
              >
                <input type="hidden" name="applicationId" value={application.id} />
                <input type="hidden" name="status" value={draft.status} />
                <input type="hidden" name="reviewNote" value={draft.reviewNote} />
                <AdminTableActionButton action="save" label="Lưu hồ sơ" type="submit" />
              </NativeForm>
            </AdminTableActions>
          );
        },
      },
    ],
    [applications, rowEdits, router]
  );

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
        application.companyName,
        application.contactName,
        application.phone,
        application.email,
        application.accountName,
        application.accountRole,
        application.city,
        application.categories,
        application.website,
        application.reviewStatus,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const statusFilterValue = (table.getColumn("reviewStatus")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters = globalFilter.trim().length > 0 || statusFilterValue.length > 0;
  const previewApplication = previewApplicationId
    ? applications.find((application) => application.id === previewApplicationId) ?? null
    : null;

  return (
    <>
      <div className="space-y-4">
        <AdminTableToolbar>
          <AdminTableSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Tìm nhà cung cấp, email, khu vực..." />
          <AdminTableSelect
            value={statusFilterValue}
            label="Lọc trạng thái"
            onChange={(value) => table.getColumn("reviewStatus")?.setFilterValue(value)}
            options={[
              { value: "", label: "Tất cả trạng thái" },
              ...REVIEW_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
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

        <AdminTableView
          table={table}
          columnCount={columns.length}
          emptyMessage="Không có hồ sơ provider nào khớp với bộ lọc hiện tại."
        />
      </div>

      <Dialog open={Boolean(previewApplication)} onOpenChange={(open) => !open && setPreviewApplicationId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewApplication?.companyName ?? "Hồ sơ provider"}</DialogTitle>
            <DialogDescription>
              {previewApplication?.contactName} • {previewApplication?.email} • {previewApplication?.phone}
            </DialogDescription>
          </DialogHeader>
          {previewApplication ? (
            <div className="grid gap-4 text-sm md:grid-cols-2">
              <div>
                <p className="font-medium">Account</p>
                <p className="mt-1 text-muted-foreground">
                  {previewApplication.accountName || "Không tìm thấy account"} {previewApplication.accountRole ? `(${previewApplication.accountRole})` : ""}
                </p>
              </div>
              <div>
                <p className="font-medium">Gửi lúc</p>
                <p className="mt-1 text-muted-foreground">{formatDateTime(previewApplication.createdAt)}</p>
              </div>
              <div>
                <p className="font-medium">Khu vực</p>
                <p className="mt-1 text-muted-foreground">{previewApplication.city || "-"}</p>
              </div>
              <div>
                <p className="font-medium">Nhóm dịch vụ/sản phẩm</p>
                <p className="mt-1 text-muted-foreground">{previewApplication.categories || "-"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="font-medium">Website/Facebook/TikTok</p>
                <p className="mt-1 break-all text-muted-foreground">{previewApplication.website || "-"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="font-medium">Kinh nghiệm/năng lực</p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{previewApplication.experience || "-"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="font-medium">Ghi chú khách gửi</p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{previewApplication.notes || "-"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="font-medium">Ghi chú admin</p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{previewApplication.reviewNote || "-"}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
