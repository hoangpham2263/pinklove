"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
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

export function AdminAffiliateApplicationsTable({ applications }: AdminAffiliateApplicationsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowEdits, setRowEdits] = useState<
    Record<string, { status: AffiliateApplication["reviewStatus"]; reviewNote: string }>
  >({});

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
        <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Người đăng ký
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="font-medium">{row.original.fullName}</p>
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
        <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Trạng thái
          <ArrowUpDown className="h-4 w-4" />
        </Button>
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
            className="min-w-52 rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:ring-1 focus:ring-ring"
          />
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Hành động</div>,
      cell: ({ row }) => {
        const draft = getRowEdit(row.original);
        return (
          <div className="flex justify-end">
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
              <Button type="submit" variant="outline" size="sm">
                Lưu
              </Button>
            </NativeForm>
          </div>
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-3 md:grid-cols-[minmax(0,320px)_220px]">
          <Input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Tìm theo tên, email, mã mong muốn..."
            className="h-9"
          />
          <select
            value={statusFilterValue}
            onChange={(event) => table.getColumn("reviewStatus")?.setFilterValue(event.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:ring-1 focus:ring-ring"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending_review">pending_review</option>
            <option value="contacted">contacted</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="archived">archived</option>
          </select>
        </div>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left font-medium">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b align-top">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Chưa có hồ sơ affiliate từ khách chưa đăng nhập.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
