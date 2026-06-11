import { DatabaseTable, type DatabaseTableProps } from "@/components/common/database-table";

type AdminDatabaseTableProps = DatabaseTableProps;

export function AdminDatabaseTable({ columns, rows, emptyMessage = "Không có dữ liệu." }: AdminDatabaseTableProps) {
  return <DatabaseTable columns={columns} rows={rows} emptyMessage={emptyMessage} />;
}
