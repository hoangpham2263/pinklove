import { DatabaseTable } from "@/components/common/database-table";
import { ProviderSectionCard } from "@/features/provider-orders/components/provider-page";

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
    <ProviderSectionCard title={title} description={description} contentClassName="pt-0">
      <DatabaseTable columns={columns} rows={rows} emptyMessage={emptyMessage} />
    </ProviderSectionCard>
  );
}
