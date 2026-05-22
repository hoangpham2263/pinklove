import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AdminDatabaseTableProps = {
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, unknown>>;
  emptyMessage?: string;
};

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function AdminDatabaseTable({ columns, rows, emptyMessage = "Không có dữ liệu." }: AdminDatabaseTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.label}</TableHead>
            ))}
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
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
