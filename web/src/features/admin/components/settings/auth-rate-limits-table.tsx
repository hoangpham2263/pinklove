"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { NativeForm } from "@/components/common/native-form";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminTableActionButton, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import { AdminTableSortButton, AdminTableToolbar } from "@/features/admin/components/admin-table-controls";
import { ROUTES } from "@/lib/routes";

type AuthRateLimitRow = {
  scope: string;
  rateKey: string;
  rateKeyShort: string;
  attempts: number;
  windowStart: string;
  expiresAt: string;
  updatedAt: string;
  status: "active" | "expired";
};

type AuthRateLimitsTableProps = {
  rows: AuthRateLimitRow[];
  scope: string;
  status: string;
  rawKey: string;
  scopeOptions: readonly string[];
  href?: string;
};

function formatDateTime(value: string) {
  return new Date(value).toISOString().slice(0, 16).replace("T", " ");
}

export function AuthRateLimitsTable({
  rows,
  scope,
  status,
  rawKey,
  scopeOptions,
  href = ROUTES.ADMIN.SECURITY_SETTINGS_AUTH_RATE_LIMITS,
}: AuthRateLimitsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<AuthRateLimitRow>[]>(
    () => [
      {
        accessorKey: "scope",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Scope</AdminTableSortButton>
        ),
      },
      {
        accessorKey: "rateKeyShort",
        header: "Hash",
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.rateKeyShort}</span>,
      },
      {
        accessorKey: "attempts",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Attempts</AdminTableSortButton>
        ),
      },
      {
        accessorKey: "windowStart",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Window start</AdminTableSortButton>
        ),
        cell: ({ row }) => formatDateTime(row.original.windowStart),
      },
      {
        accessorKey: "expiresAt",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Expires</AdminTableSortButton>
        ),
        cell: ({ row }) => formatDateTime(row.original.expiresAt),
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Updated</AdminTableSortButton>
        ),
        cell: ({ row }) => formatDateTime(row.original.updatedAt),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <AdminTableSortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Status</AdminTableSortButton>
        ),
        cell: ({ row }) => (
          <Badge variant={row.original.status === "active" ? "default" : "secondary"}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <AdminTableActions>
            <NativeForm action={ROUTES.API.ADMIN.SECURITY.AUTH_RATE_LIMIT_ACTION} method="POST" className="inline-block">
              <input type="hidden" name="intent" value="unlock_row" />
              <input type="hidden" name="scope" value={row.original.scope} />
              <input type="hidden" name="rateKey" value={row.original.rateKey} />
              <AdminTableActionButton action="delete" label="Unlock" type="submit" />
            </NativeForm>
          </AdminTableActions>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => `${row.scope}:${row.rateKey}`,
  });

  const hasFilters = scope !== "all" || status !== "all" || rawKey.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <NativeForm action={href} method="GET" className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <AdminTableToolbar>
            <select name="rateLimitScope" defaultValue={scope} className="h-9 min-w-45 rounded-lg border border-input bg-background px-3 text-sm outline-none">
              {scopeOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All scopes" : option}
                </option>
              ))}
            </select>
            <select name="rateLimitStatus" defaultValue={status} className="h-9 min-w-40 rounded-lg border border-input bg-background px-3 text-sm outline-none">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
            <input
              name="rateLimitRawKey"
              defaultValue={rawKey}
              placeholder="Hash search email, phone hoặc IP..."
              className="h-9 min-w-72 rounded-lg border border-input bg-background px-3 text-sm outline-none"
            />
            <AdminSubmitButton>Lọc</AdminSubmitButton>
            {hasFilters ? (
              <Link href={href}>
                <AdminTableActionButton action="clear" label="Clear filters" />
              </Link>
            ) : null}
          </AdminTableToolbar>
        </NativeForm>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <NativeForm action={ROUTES.API.ADMIN.SECURITY.AUTH_RATE_LIMIT_ACTION} method="POST" className="inline-block">
            <input type="hidden" name="intent" value="clear_expired" />
            <AdminSubmitButton>Clear expired</AdminSubmitButton>
          </NativeForm>
          {scope !== "all" ? (
            <NativeForm action={ROUTES.API.ADMIN.SECURITY.AUTH_RATE_LIMIT_ACTION} method="POST" className="inline-block">
              <input type="hidden" name="intent" value="unlock_scope" />
              <input type="hidden" name="scope" value={scope} />
              <AdminSubmitButton>Unlock scope</AdminSubmitButton>
            </NativeForm>
          ) : null}
        </div>
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
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Không có rate-limit record phù hợp.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
