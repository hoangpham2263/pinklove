import type { LucideIcon } from "lucide-react";

import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { AdminDatabaseTable } from "@/features/admin/components/admin-database-table";

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
  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <AdminOverviewGrid className="md:grid-cols-1 lg:grid-cols-1">
        <AdminOverviewCard title={metricLabel} value={rows.length} icon={icon} />
      </AdminOverviewGrid>

      <AdminDatabaseTable columns={columns} rows={rows} />
    </section>
  );
}
