import type { ComponentType, ReactNode } from "react";

import { DatabaseTable } from "@/components/common/database-table";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";

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
};

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
        <DatabaseTable columns={columns} rows={rows} emptyMessage={emptyMessage} />
      </div>

      {children}
    </section>
  );
}
