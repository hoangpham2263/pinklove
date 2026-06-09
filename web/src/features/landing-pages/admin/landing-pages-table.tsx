"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminCreateLinkButton, AdminLinkButton } from "@/features/admin/components/admin-buttons";
import { AdminTableActionButton, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import {
  AdminTableClearButton,
  AdminTableSearch,
  AdminTableSelect,
  AdminTableSortButton,
  AdminTableToolbar,
} from "@/features/admin/components/admin-table-controls";
import { LandingPageCopyLinkButton } from "@/features/landing-pages/admin/landing-page-copy-link-button";
import { LandingPageDeleteButton } from "@/features/landing-pages/admin/landing-page-delete-button";
import type { LandingPageWithSource } from "@/features/landing-pages/types";
import { getLandingPagePath } from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";

type LandingPagesTableProps = {
  landingPages: LandingPageWithSource[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function LandingPagesTable({ landingPages }: LandingPagesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [offeringFilter, setOfferingFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [previewLandingPageId, setPreviewLandingPageId] = useState<string | null>(null);
  const previewLandingPage = landingPages.find((landingPage) => landingPage.id === previewLandingPageId) ?? null;
  const offeringOptions = useMemo(
    () =>
      Array.from(
        new Map(
          landingPages
            .filter((landingPage) => landingPage.sourceOfferingId && landingPage.sourceOfferingName)
            .map((landingPage) => [landingPage.sourceOfferingId!, landingPage.sourceOfferingName!])
        ).entries()
      ).sort((a, b) => a[1].localeCompare(b[1], "vi")),
    [landingPages]
  );
  const typeOptions = useMemo(
    () => Array.from(new Set(landingPages.map((landingPage) => landingPage.pageType))).sort(),
    [landingPages]
  );
  const filteredLandingPages = useMemo(
    () =>
      landingPages.filter(
        (landingPage) =>
          (!offeringFilter || landingPage.sourceOfferingId === offeringFilter) &&
          (!statusFilter || landingPage.status === statusFilter) &&
          (!typeFilter || landingPage.pageType === typeFilter)
      ),
    [landingPages, offeringFilter, statusFilter, typeFilter]
  );
  const hasFilters = Boolean(globalFilter || offeringFilter || statusFilter || typeFilter);

  function clearFilters() {
    setGlobalFilter("");
    setOfferingFilter("");
    setStatusFilter("");
    setTypeFilter("");
  }

  const columns = useMemo<ColumnDef<LandingPageWithSource>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Landing page
          </AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="font-mono text-xs text-muted-foreground">{row.original.slug}</div>
          </div>
        ),
      },
      {
        accessorKey: "sourceOfferingName",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Product
          </AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.sourceOfferingName ?? "Chưa chọn"}</div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => <Badge variant={row.original.status === "published" ? "default" : "secondary"}>{row.original.status}</Badge>,
      },
      {
        id: "actions",
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => {
          const landingPage = row.original;
          return (
            <AdminTableActions>
              <AdminTableActionButton action="view" label="Xem" onClick={() => setPreviewLandingPageId(landingPage.id)} />
              <AdminTableActionButton action="edit" label="Sửa" href={ROUTES.ADMIN.LANDING_PAGE(landingPage.id)} />
              <AdminTableActionButton action="external" label="Mở trang" href={getLandingPagePath(landingPage)} target="_blank" />
              <LandingPageDeleteButton landingPageId={landingPage.id} landingPageName={landingPage.name} />
            </AdminTableActions>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredLandingPages,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const keyword = String(filterValue).trim().toLowerCase();
      if (!keyword) return true;
      const landingPage = row.original;
      return [landingPage.name, landingPage.slug, landingPage.sourceOfferingName, landingPage.sourceOfferingSlug, landingPage.pageType, landingPage.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <AdminTableToolbar>
            <AdminTableSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Tìm landing hoặc sản phẩm..." />
            <AdminTableSelect
              value={offeringFilter}
              onChange={setOfferingFilter}
              label="Lọc theo sản phẩm"
              options={[
                { value: "", label: "Tất cả sản phẩm" },
                ...offeringOptions.map(([value, label]) => ({ value, label })),
              ]}
            />
            <AdminTableSelect
              value={statusFilter}
              onChange={setStatusFilter}
              label="Lọc theo trạng thái"
              options={[
                { value: "", label: "Tất cả trạng thái" },
                { value: "published", label: "Published" },
                { value: "draft", label: "Draft" },
                { value: "archived", label: "Archived" },
                { value: "disabled", label: "Disabled" },
              ]}
              className="md:w-48"
            />
            <AdminTableSelect
              value={typeFilter}
              onChange={setTypeFilter}
              label="Lọc theo loại landing"
              options={[
                { value: "", label: "Tất cả loại" },
                ...typeOptions.map((value) => ({ value, label: value })),
              ]}
              className="md:w-44"
            />
            <AdminTableClearButton visible={hasFilters} onClick={clearFilters} />
          </AdminTableToolbar>
          <AdminCreateLinkButton href={ROUTES.ADMIN.LANDING_PAGE_NEW}>Tạo landing</AdminCreateLinkButton>
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
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Không có dữ liệu.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={Boolean(previewLandingPage)} onOpenChange={(open) => !open && setPreviewLandingPageId(null)}>
        {previewLandingPage ? (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{previewLandingPage.name}</DialogTitle>
              <DialogDescription>{previewLandingPage.sourceOfferingName}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <PreviewField label="Slug" value={previewLandingPage.slug} />
              <PreviewField label="Loại" value={previewLandingPage.pageType} />
              <PreviewField label="Trạng thái" value={previewLandingPage.status} />
              <PreviewField label="Sections" value={previewLandingPage.sectionCount ?? 0} />
              <PreviewField label="Cập nhật" value={formatDate(previewLandingPage.updatedAt)} />
            </div>
            <LandingPageCopyLinkButton path={getLandingPagePath(previewLandingPage)} />
            <div className="flex justify-end gap-2">
              <AdminLinkButton href={ROUTES.ADMIN.LANDING_PAGE(previewLandingPage.id)}>Sửa</AdminLinkButton>
              <AdminLinkButton href={getLandingPagePath(previewLandingPage)} target="_blank">Mở trang</AdminLinkButton>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}

function PreviewField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <div className="rounded-md bg-muted/40 px-3 py-2 text-sm">{value || "—"}</div>
    </div>
  );
}
