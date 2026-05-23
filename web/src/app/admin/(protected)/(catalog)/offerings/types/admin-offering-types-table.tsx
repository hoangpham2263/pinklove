"use client";

import { type FormEvent, useMemo, useState } from "react";
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
import { Plus } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
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
import { AdminCancelButton, AdminOutlineButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminTableActionButton, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import { AdminTableClearButton, AdminTableSearch, AdminTableSelect, AdminTableToolbar, AdminTableSortButton } from "@/features/admin/components/admin-table-controls";
import {
  SYSTEM_OFFERING_TYPES,
  type OfferingFulfillmentType,
  type OfferingTypeDefinition,
} from "@/features/offerings/types";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";
import { OfferingTypeFieldsBuilder } from "./offering-type-fields-builder";

type AdminOfferingTypesTableProps = {
  offeringTypes: OfferingTypeDefinition[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function AdminOfferingTypesTable({ offeringTypes }: AdminOfferingTypesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [previewTypeId, setPreviewTypeId] = useState<string | null>(null);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const previewType = offeringTypes.find((type) => type.id === previewTypeId) ?? null;
  const editingType = offeringTypes.find((type) => type.id === editingTypeId) ?? null;

  const columns = useMemo<ColumnDef<OfferingTypeDefinition>[]>(
    () => [
      {
        accessorKey: "label",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Type
          </AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.label}</div>
            <div className="font-mono text-xs text-muted-foreground">{row.original.key}</div>
          </div>
        ),
      },
      {
        accessorKey: "fulfillmentType",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Fulfillment
          </AdminTableSortButton>
        ),
        filterFn: (row, columnId, filterValue) => !filterValue || row.getValue<string>(columnId) === filterValue,
      },
      {
        accessorKey: "fieldSchema",
        header: "Fields",
        cell: ({ row }) => row.original.fieldSchema.length,
      },
      {
        accessorKey: "supportsInventory",
        header: "Inventory",
        cell: ({ row }) => (row.original.supportsInventory ? "Yes" : "No"),
      },
      {
        accessorKey: "supportsProviderSupply",
        header: "Provider",
        cell: ({ row }) => (row.original.supportsProviderSupply ? "Yes" : "No"),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Status
          </AdminTableSortButton>
        ),
        filterFn: (row, columnId, filterValue) => !filterValue || row.getValue<string>(columnId) === filterValue,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Badge variant={row.original.status === "active" ? "default" : "secondary"}>{row.original.status}</Badge>
            {row.original.isSystem ? <span className="rounded border px-1.5 py-0.5 text-xs text-muted-foreground">system</span> : null}
          </div>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Updated
          </AdminTableSortButton>
        ),
        cell: ({ row }) => formatDate(row.original.updatedAt),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => {
          const type = row.original;
          return (
            <AdminTableActions>
              <AdminTableActionButton action="view" label="Xem type" onClick={() => setPreviewTypeId(type.id)} />
              <AdminTableActionButton action="edit" label="Sửa type" onClick={() => setEditingTypeId(type.id)} />
              <AdminTableActionButton
                action="external"
                label="Tạo offering"
                href={
                  type.key === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE
                    ? ROUTES.ADMIN.OFFERING_BUILDER
                    : `${ROUTES.ADMIN.OFFERINGS}?type=${encodeURIComponent(type.key)}`
                }
              />
            </AdminTableActions>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: offeringTypes,
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
      const type = row.original;
      return [type.key, type.label, type.description, type.fulfillmentType, type.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const statusFilterValue = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "";
  const fulfillmentFilterValue = (table.getColumn("fulfillmentType")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters = globalFilter.trim().length > 0 || statusFilterValue.length > 0 || fulfillmentFilterValue.length > 0;

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <AdminTableToolbar>
            <AdminTableSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Tìm type, key, fulfillment..." />
            <AdminTableSelect
              value={statusFilterValue}
              label="Lọc trạng thái"
              onChange={(value) => table.getColumn("status")?.setFilterValue(value)}
              options={[
                { value: "", label: "Tất cả trạng thái" },
                { value: "active", label: "Active" },
                { value: "draft", label: "Draft" },
                { value: "archived", label: "Archived" },
              ]}
            />
            <AdminTableSelect
              value={fulfillmentFilterValue}
              label="Lọc fulfillment"
              onChange={(value) => table.getColumn("fulfillmentType")?.setFilterValue(value)}
              options={[
                { value: "", label: "Tất cả fulfillment" },
                { value: "digital", label: "Digital" },
                { value: "physical", label: "Physical" },
                { value: "service", label: "Service" },
              ]}
            />
            <AdminTableClearButton
              visible={hasFilters}
              onClick={() => {
                setGlobalFilter("");
                table.getColumn("status")?.setFilterValue("");
                table.getColumn("fulfillmentType")?.setFilterValue("");
              }}
            />
          </AdminTableToolbar>

          <Button type="button" onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 size-4" />
            Tạo type
          </Button>
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
                    Không có offering type phù hợp.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={Boolean(previewType)} onOpenChange={(open) => !open && setPreviewTypeId(null)}>
        {previewType ? (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{previewType.label}</DialogTitle>
              <DialogDescription>{previewType.key}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-3">
              <PreviewField label="Fulfillment" value={previewType.fulfillmentType} />
              <PreviewField label="Status" value={previewType.status} />
              <PreviewField label="Fields" value={previewType.fieldSchema.length} />
              <PreviewField label="Template key" value={previewType.templateKey} />
              <PreviewField label="Inventory" value={previewType.supportsInventory ? "Yes" : "No"} />
              <PreviewField label="Provider supply" value={previewType.supportsProviderSupply ? "Yes" : "No"} />
            </div>
            <div className="rounded-md border p-3 text-sm text-muted-foreground">
              {previewType.description || "Không có mô tả."}
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewType.fieldSchema.length ? (
                    previewType.fieldSchema.map((field) => (
                      <TableRow key={field.key}>
                        <TableCell className="font-mono text-xs">{field.key}</TableCell>
                        <TableCell>{field.label}</TableCell>
                        <TableCell>{field.type}</TableCell>
                        <TableCell>{field.required ? "Yes" : "No"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                        Chưa có field.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end">
              <AdminOutlineButton
                onClick={() => {
                  setPreviewTypeId(null);
                  setEditingTypeId(previewType.id);
                }}
              >
                Chỉnh sửa
              </AdminOutlineButton>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <OfferingTypeForm onClose={() => setIsCreating(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingType)} onOpenChange={(open) => !open && setEditingTypeId(null)}>
        {editingType ? (
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <OfferingTypeForm offeringType={editingType} onClose={() => setEditingTypeId(null)} />
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
      <div className="min-h-9 rounded-md bg-muted/40 px-3 py-2 text-sm">{value || "—"}</div>
    </div>
  );
}

function OfferingTypeForm({
  offeringType,
  onClose,
}: {
  offeringType?: OfferingTypeDefinition;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = Boolean(offeringType);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = await adminApi.saveOfferingType(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã lưu offering type.");
      finishMutation(router, result, { redirect: false, refresh: true });
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu offering type.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Chỉnh offering type" : "Tạo offering type"}</DialogTitle>
        <DialogDescription>Quản lý type và field definitions bằng table, form chỉ dùng cho thao tác create/edit nhanh.</DialogDescription>
      </DialogHeader>

      <NativeForm action={adminApiActions.saveOfferingType} method="POST" className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="type-key" className="text-sm font-medium">Key</label>
            <Input
              id="type-key"
              name="key"
              defaultValue={offeringType?.key ?? ""}
              placeholder="video_invitation"
              required
              pattern="[a-z][a-z0-9_]*"
              readOnly={offeringType?.isSystem}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="type-label" className="text-sm font-medium">Tên hiển thị</label>
            <Input id="type-label" name="label" defaultValue={offeringType?.label ?? ""} placeholder="Video cưới" required />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="type-description" className="text-sm font-medium">Mô tả</label>
          <textarea
            id="type-description"
            name="description"
            defaultValue={offeringType?.description ?? ""}
            className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="type-fulfillment" className="text-sm font-medium">Fulfillment</label>
            <select
              id="type-fulfillment"
              name="fulfillmentType"
              defaultValue={offeringType?.fulfillmentType ?? "digital"}
              className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
            >
              {(["digital", "physical", "service"] satisfies OfferingFulfillmentType[]).map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="type-status" className="text-sm font-medium">Trạng thái</label>
            <select
              id="type-status"
              name="status"
              defaultValue={offeringType?.status ?? "active"}
              className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
            >
              <option value="active">active</option>
              <option value="draft">draft</option>
              <option value="archived">archived</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="type-template-key" className="text-sm font-medium">Template key</label>
            <Input id="type-template-key" name="templateKey" defaultValue={offeringType?.templateKey ?? ""} placeholder="video_invitation" />
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="supportsInventory" defaultChecked={offeringType?.supportsInventory ?? false} /> Có tồn kho
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="supportsProviderSupply" defaultChecked={offeringType?.supportsProviderSupply ?? false} /> Cho provider supply
          </label>
        </div>

        <OfferingTypeFieldsBuilder initialFields={offeringType?.fieldSchema} />

        <div className="flex justify-end gap-3">
          <AdminCancelButton type="button" onClick={onClose}>Hủy</AdminCancelButton>
          <AdminSubmitButton disabled={isSaving}>{isSaving ? "Đang lưu..." : "Lưu type"}</AdminSubmitButton>
        </div>
      </NativeForm>
    </>
  );
}
