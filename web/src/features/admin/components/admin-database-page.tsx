import type { LucideIcon } from "lucide-react";

import { DatabasePage } from "@/components/common/database-table";

type AdminDatabasePageProps = {
  title: string;
  description: string;
  rows: Array<Record<string, unknown>>;
  columns: Array<{ key: string; label: string }>;
  icon: LucideIcon;
  metricLabel?: string;
};

export function AdminDatabasePage({
  title,
  description,
  rows,
  columns,
  icon,
  metricLabel = "Records",
}: AdminDatabasePageProps) {
  return <DatabasePage title={title} description={description} rows={rows} columns={columns} icon={icon} metricLabel={metricLabel} />;
}
