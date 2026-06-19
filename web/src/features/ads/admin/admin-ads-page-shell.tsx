import type { ComponentType, ReactNode } from "react";

import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AdminAdsMetric = {
  title: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
};

type AdminAdsColumn = {
  key: string;
  label: string;
};

type AdminAdsPageShellProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  metrics: AdminAdsMetric[];
  tableTitle: string;
  tableDescription?: string;
  rows: Array<Record<string, unknown>>;
  columns: AdminAdsColumn[];
  emptyMessage?: string;
  children?: ReactNode;
  rowActions?: (row: Record<string, unknown>) => ReactNode;
};

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function AdminAdsPageShell({
  title,
  description,
  actions,
  metrics,
  tableTitle,
  tableDescription,
  rows,
  columns,
  emptyMessage,
  children,
  rowActions,
}: AdminAdsPageShellProps) {
  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
      </div>

      <AdminOverviewGrid className="md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <AdminOverviewCard
            key={String(metric.title)}
            title={metric.title}
            value={metric.value}
            description={metric.description}
            icon={metric.icon}
          />
        ))}
      </AdminOverviewGrid>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{tableTitle}</h2>
          {tableDescription ? <p className="text-sm text-muted-foreground">{tableDescription}</p> : null}
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
                {rowActions ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length ? rows.map((row, index) => (
                <TableRow key={String(row.id ?? index)}>
                  {columns.map((column) => {
                    const value = row[column.key];
                    const text = formatValue(value);
                    const isStatus = column.key.endsWith("status") || column.key === "status";
                    return (
                      <TableCell key={column.key} className="max-w-96 align-top text-sm">
                        {isStatus && text !== "—" ? <Badge>{text}</Badge> : <span className="break-words">{text}</span>}
                      </TableCell>
                    );
                  })}
                  {rowActions ? <TableCell className="align-top text-right">{rowActions(row)}</TableCell> : null}
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={columns.length + (rowActions ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                    {emptyMessage ?? "Không có dữ liệu."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {children}
    </section>
  );
}
