"use client";

import { type ReactNode, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminIconButton, AdminLinkButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminTableActionButton, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import {
  AdminTableClearButton,
  AdminTableSearch,
  AdminTableSelect,
  AdminTableSortButton,
  AdminTableToolbar,
} from "@/features/admin/components/admin-table-controls";
import type { AccountStatus, AccountUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export type AdminProviderAccountRow = AccountUser & {
  providerId: string;
  providerType: string;
  providerStatus: string;
  assignmentTotal: number;
  assignmentActive: number;
  assignmentReview: number;
  assignmentCompleted: number;
  submittedOfferings: number;
  pendingOfferings: number;
};

type AdminProviderAccountListProps = {
  providerAccounts: AdminProviderAccountRow[];
};

function getProviderName(provider: AccountUser) {
  return provider.displayName || provider.fullName || provider.username;
}

function getAccountStatusLabel(status: AccountStatus) {
  switch (status) {
    case "blocked":
      return "Đang block";
    case "banned":
      return "Đã ban";
    case "deleted":
      return "Đã xóa mềm";
    case "active":
    default:
      return "Đang hoạt động";
  }
}

function getAccountStatusBadgeVariant(status: AccountStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "blocked":
      return "outline";
    case "banned":
      return "destructive";
    case "deleted":
      return "secondary";
    case "active":
    default:
      return "default";
  }
}

function getProviderTypeLabel(value: string) {
  switch (value) {
    case "creator":
      return "Creator";
    case "studio":
      return "Studio";
    case "planner":
      return "Planner";
    case "makeup":
      return "Makeup";
    case "photographer":
      return "Photographer";
    case "florist":
      return "Florist";
    case "videographer":
      return "Videographer";
    case "supplier":
    default:
      return "Supplier";
  }
}

function getProviderStatusLabel(value: string) {
  switch (value) {
    case "published":
      return "Published";
    case "archived":
      return "Archived";
    case "draft":
    default:
      return "Draft";
  }
}

function PreviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-md border p-4">
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </section>
  );
}

function PreviewField({
  label,
  value,
  className = "",
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <div className="min-h-9 rounded-md bg-muted/40 px-3 py-2 text-sm text-foreground">{value || "—"}</div>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toISOString().slice(0, 16).replace("T", " ");
}

function getProviderTableCellClassName(columnId: string) {
  switch (columnId) {
    case "displayName":
      return "w-[38%] min-w-0";
    case "assignmentTotal":
      return "hidden w-[18%] lg:table-cell";
    case "submittedOfferings":
      return "hidden w-[16%] xl:table-cell";
    case "accountStatus":
      return "hidden w-[18%] md:table-cell";
    case "actions":
      return "w-[184px] min-w-[184px] text-right md:w-[204px] md:min-w-[204px]";
    default:
      return undefined;
  }
}

function getPortalUrl(path: string) {
  if (typeof window === "undefined") {
    return path;
  }

  return path.startsWith("/") ? `${window.location.origin}${path}` : path;
}

function PortalCopyRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)_32px] items-center gap-2 rounded-md bg-muted/40 px-3 py-2">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="truncate font-mono text-xs text-foreground">{value}</p>
      <AdminIconButton aria-label={`Copy ${label}`} className="h-8 w-8" onClick={onCopy}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </AdminIconButton>
    </div>
  );
}

function ProviderPortalPreview({ provider }: { provider: AdminProviderAccountRow }) {
  const [copiedField, setCopiedField] = useState<"portal" | "username" | "all" | null>(null);

  if (!provider.providerPortalSlug) {
    return (
      <PreviewSection title="Thông tin gửi đối tác">
        <p className="text-sm text-muted-foreground">Provider này chưa có portal.</p>
      </PreviewSection>
    );
  }

  const portalUrl = getPortalUrl(ROUTES.PROVIDER.ROOT);
  const allText = `Portal: ${portalUrl}\nUsername: ${provider.username}`;

  async function handleCopy(value: string, field: "portal" | "username" | "all", message: string) {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast(message);
    window.setTimeout(() => setCopiedField((current) => (current === field ? null : current)), 1500);
  }

  return (
    <PreviewSection title="Thông tin gửi đối tác">
      <div className="space-y-2">
        <PortalCopyRow
          label="Portal"
          value={portalUrl}
          copied={copiedField === "portal"}
          onCopy={() => handleCopy(portalUrl, "portal", "Đã copy link portal đối tác.")}
        />
        <PortalCopyRow
          label="Username"
          value={provider.username}
          copied={copiedField === "username"}
          onCopy={() => handleCopy(provider.username, "username", "Đã copy username đối tác.")}
        />
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Không hiển thị mật khẩu cũ. Reset mật khẩu trong màn hình sửa tài khoản nếu cần gửi password mới.
        </p>

        <div className="flex justify-end">
          <AdminSubmitButton
            type="button"
            size="sm"
            className="mt-1 h-8 px-3"
            onClick={() => handleCopy(allText, "all", "Đã copy toàn bộ thông tin đối tác.")}
          >
            {copiedField === "all" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiedField === "all" ? "Đã copy" : "Copy toàn bộ"}
          </AdminSubmitButton>
        </div>
      </div>
    </PreviewSection>
  );
}

export function AdminProviderAccountList({ providerAccounts }: AdminProviderAccountListProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [previewProviderId, setPreviewProviderId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<AdminProviderAccountRow>[]>(
    () => [
      {
        accessorKey: "displayName",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Provider
          </AdminTableSortButton>
        ),
        cell: ({ row }) => {
          const provider = row.original;

          return (
            <div className="space-y-1">
              <p className="truncate font-medium">{getProviderName(provider)}</p>
              <p className="truncate text-xs text-muted-foreground">
                {getProviderTypeLabel(provider.providerType)} / {getProviderStatusLabel(provider.providerStatus)}
              </p>
            </div>
          );
        },
        sortingFn: (rowA, rowB) => getProviderName(rowA.original).localeCompare(getProviderName(rowB.original)),
      },
      {
        accessorKey: "providerType",
        header: "Loại provider",
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>(columnId) === filterValue;
        },
      },
      {
        accessorKey: "providerStatus",
        header: "Trạng thái hồ sơ",
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>(columnId) === filterValue;
        },
      },
      {
        accessorKey: "assignmentTotal",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Đơn
          </AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <p className="text-sm">{row.original.assignmentTotal} đơn</p>
        ),
      },
      {
        accessorKey: "submittedOfferings",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Sản phẩm
          </AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <p className="text-sm">{row.original.submittedOfferings} hồ sơ</p>
        ),
      },
      {
        accessorKey: "accountStatus",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Trạng thái
          </AdminTableSortButton>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>(columnId) === filterValue;
        },
        cell: ({ row }) => (
          <Badge variant={getAccountStatusBadgeVariant(row.original.accountStatus)}>
            {getAccountStatusLabel(row.original.accountStatus)}
          </Badge>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => {
          const provider = row.original;

          return (
            <AdminTableActions>
              <AdminTableActionButton action="view" label="Xem provider" onClick={() => setPreviewProviderId(provider.id)} />
              <AdminTableActionButton action="edit" label="Chi tiết provider" href={ROUTES.ADMIN.PROVIDER_ACCOUNT(provider.id)} />
              {provider.providerPortalSlug ? (
                <AdminTableActionButton
                  action="external"
                  label="Mở portal"
                  href={ROUTES.PROVIDER.ROOT}
                />
              ) : null}
              <AdminTableActionButton
                action="approve"
                label="Review sản phẩm"
                href={`${ROUTES.ADMIN.PROVIDER_OFFERINGS}?providerId=${encodeURIComponent(provider.id)}`}
              />
            </AdminTableActions>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: providerAccounts,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility: {
        providerType: false,
        providerStatus: false,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const keyword = String(filterValue).trim().toLowerCase();
      if (!keyword) return true;

      const provider = row.original;
      return [
        provider.username,
        provider.fullName,
        provider.displayName,
        provider.phone,
        provider.providerPortalSlug,
        provider.providerType,
        getProviderTypeLabel(provider.providerType),
        provider.providerStatus,
        getProviderStatusLabel(provider.providerStatus),
        provider.accountStatus,
        getAccountStatusLabel(provider.accountStatus),
        provider.accountStatusReason,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const statusFilterValue = (table.getColumn("accountStatus")?.getFilterValue() as string | undefined) ?? "";
  const providerTypeFilterValue = (table.getColumn("providerType")?.getFilterValue() as string | undefined) ?? "";
  const providerStatusFilterValue = (table.getColumn("providerStatus")?.getFilterValue() as string | undefined) ?? "";
  const hasFilters =
    globalFilter.trim().length > 0 ||
    statusFilterValue.length > 0 ||
    providerTypeFilterValue.length > 0 ||
    providerStatusFilterValue.length > 0;
  const previewProvider = previewProviderId ? providerAccounts.find((provider) => provider.id === previewProviderId) ?? null : null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Danh sách provider</h2>

      <AdminTableToolbar>
        <AdminTableSearch
          value={globalFilter}
          onChange={setGlobalFilter}
          placeholder="Tìm provider, username, portal, loại..."
        />
        <AdminTableSelect
          value={statusFilterValue}
          label="Lọc trạng thái tài khoản"
          onChange={(value) => table.getColumn("accountStatus")?.setFilterValue(value)}
          options={[
            { value: "", label: "Tất cả tài khoản" },
            { value: "active", label: "Đang hoạt động" },
            { value: "blocked", label: "Đang block" },
            { value: "banned", label: "Đã ban" },
            { value: "deleted", label: "Đã xóa mềm" },
          ]}
        />
        <AdminTableSelect
          value={providerTypeFilterValue}
          label="Lọc loại provider"
          onChange={(value) => table.getColumn("providerType")?.setFilterValue(value)}
          options={[
            { value: "", label: "Tất cả loại" },
            { value: "supplier", label: getProviderTypeLabel("supplier") },
            { value: "creator", label: getProviderTypeLabel("creator") },
            { value: "studio", label: getProviderTypeLabel("studio") },
            { value: "planner", label: getProviderTypeLabel("planner") },
            { value: "makeup", label: getProviderTypeLabel("makeup") },
            { value: "photographer", label: getProviderTypeLabel("photographer") },
            { value: "florist", label: getProviderTypeLabel("florist") },
            { value: "videographer", label: getProviderTypeLabel("videographer") },
          ]}
        />
        <AdminTableSelect
          value={providerStatusFilterValue}
          label="Lọc trạng thái hồ sơ"
          onChange={(value) => table.getColumn("providerStatus")?.setFilterValue(value)}
          options={[
            { value: "", label: "Tất cả hồ sơ" },
            { value: "draft", label: getProviderStatusLabel("draft") },
            { value: "published", label: getProviderStatusLabel("published") },
            { value: "archived", label: getProviderStatusLabel("archived") },
          ]}
        />
        <AdminTableClearButton
          visible={hasFilters}
          onClick={() => {
            setGlobalFilter("");
            table.getColumn("accountStatus")?.setFilterValue("");
            table.getColumn("providerType")?.setFilterValue("");
            table.getColumn("providerStatus")?.setFilterValue("");
          }}
        />
      </AdminTableToolbar>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={getProviderTableCellClassName(header.column.id)}>
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
                    <TableCell key={cell.id} className={getProviderTableCellClassName(cell.column.id)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center">
                  Không có provider phù hợp với bộ lọc hiện tại.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(previewProvider)} onOpenChange={(open) => !open && setPreviewProviderId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          {previewProvider ? (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle>{getProviderName(previewProvider)}</DialogTitle>
                <DialogDescription>@{previewProvider.username}</DialogDescription>
              </DialogHeader>

              <PreviewSection title="Tài khoản">
                <div className="grid gap-3 md:grid-cols-2">
                  <PreviewField label="ID" value={<span className="break-all">{previewProvider.id}</span>} />
                  <PreviewField label="Username" value={previewProvider.username} />
                  <PreviewField label="Tên hiển thị" value={previewProvider.displayName || "—"} />
                  <PreviewField label="Họ tên" value={previewProvider.fullName || "—"} />
                  <PreviewField label="Điện thoại" value={previewProvider.phone || "—"} />
                  <PreviewField label="Trạng thái" value={getAccountStatusLabel(previewProvider.accountStatus)} />
                  <PreviewField label="Provider" value={`${previewProvider.providerType} / ${previewProvider.providerStatus}`} />
                  <PreviewField label="Tạo lúc" value={formatDateTime(previewProvider.createdAt)} />
                  <PreviewField label="Portal" value={previewProvider.providerPortalSlug ? ROUTES.PROVIDER.ROOT : "—"} />
                  <PreviewField label="Provider ID" value={<span className="break-all">{previewProvider.providerId || "—"}</span>} />
                </div>
              </PreviewSection>

              <PreviewSection title="Vận hành">
                <div className="grid gap-3 md:grid-cols-2">
                  <PreviewField label="Tổng đơn" value={previewProvider.assignmentTotal} />
                  <PreviewField label="Đang xử lý" value={previewProvider.assignmentActive} />
                  <PreviewField label="Chờ review" value={previewProvider.assignmentReview} />
                  <PreviewField label="Hoàn tất" value={previewProvider.assignmentCompleted} />
                  <PreviewField label="Yêu cầu dịch vụ/sản phẩm" value={previewProvider.submittedOfferings} />
                  <PreviewField label="Cần xử lý" value={previewProvider.pendingOfferings} />
                </div>
              </PreviewSection>

              <ProviderPortalPreview provider={previewProvider} />

              <PreviewSection title="Ghi chú">
                <PreviewField label="Lý do trạng thái" value={previewProvider.accountStatusReason || "—"} />
                <PreviewField label="Bio" value={<span className="whitespace-pre-wrap">{previewProvider.bio || "—"}</span>} />
              </PreviewSection>

              <div className="flex flex-wrap justify-end gap-2">
                <AdminLinkButton href={ROUTES.ADMIN.PROVIDER_ACCOUNT(previewProvider.id)}>Mở chi tiết</AdminLinkButton>
                <AdminLinkButton href={`${ROUTES.ADMIN.USERS}/${previewProvider.id}?returnTo=${encodeURIComponent(ROUTES.ADMIN.PROVIDER_ACCOUNTS)}`}>
                  Sửa account
                </AdminLinkButton>
                <AdminLinkButton href={`${ROUTES.ADMIN.PROVIDER_OFFERINGS}?providerId=${encodeURIComponent(previewProvider.id)}`}>
                  Review sản phẩm
                </AdminLinkButton>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
