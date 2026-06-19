import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OverviewCardTemplate, OverviewGridTemplate } from "@/components/common/overview-card-template";

type DatabaseColumn = { key: string; label: string };

export type DatabaseTableProps = {
  columns: DatabaseColumn[];
  rows: Array<Record<string, unknown>>;
  emptyMessage?: string;
  rowActions?: (row: Record<string, unknown>) => ReactNode;
};

export type DatabasePageProps = {
  title: string;
  description: string;
  rows: Array<Record<string, unknown>>;
  columns: DatabaseColumn[];
  icon: LucideIcon;
  metricLabel?: string;
};

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function DatabaseTable({ columns, rows, emptyMessage = "Không có dữ liệu.", rowActions }: DatabaseTableProps) {
  return (
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
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function DatabasePage({
  title,
  description,
  rows,
  columns,
  icon,
  metricLabel = "Records",
}: DatabasePageProps) {
  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <OverviewGridTemplate className="md:grid-cols-1 lg:grid-cols-1">
        <OverviewCardTemplate title={metricLabel} value={rows.length} icon={icon} />
      </OverviewGridTemplate>

      <DatabaseTable columns={columns} rows={rows} />
    </section>
  );
}
