import { DatabaseTable } from "@/components/common/database-table";

type ProviderDataColumn = {
  key: string;
  label: string;
};

type ProviderDataSectionProps = {
  title: string;
  description?: string;
  rows: Array<Record<string, unknown>>;
  columns: ProviderDataColumn[];
  emptyMessage?: string;
};

export function ProviderDataSection({
  title,
  description,
  rows,
  columns,
  emptyMessage,
}: ProviderDataSectionProps) {
  return (
    <div className="space-y-4">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      <DatabaseTable columns={columns} rows={rows} emptyMessage={emptyMessage} />
    </div>
  );
}
