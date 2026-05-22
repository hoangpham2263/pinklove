import { Tags } from "lucide-react";

import { AdminDatabasePage } from "@/features/admin/components/admin-database-page";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/database";

export default async function AdminTemplateAttributesPage() {
  await requireAdmin();
  const result = await query<Record<string, unknown>>(`
    SELECT
      attr.key,
      attr.label,
      attr.attribute_type,
      COUNT(value.id)::int AS value_count,
      attr.sort_order,
      attr.updated_at
    FROM template_attributes attr
    LEFT JOIN template_attribute_values value ON value.attribute_id = attr.id
    GROUP BY attr.id
    ORDER BY attr.sort_order ASC, attr.label ASC
  `);

  return (
    <AdminDatabasePage
      title="Template Attributes"
      description="Discovery/SEO attributes cho template và offering."
      rows={result.rows}
      icon={Tags}
      metricLabel="Attributes"
      columns={[
        { key: "key", label: "Key" },
        { key: "label", label: "Label" },
        { key: "attribute_type", label: "Type" },
        { key: "value_count", label: "Values" },
        { key: "sort_order", label: "Sort" },
        { key: "updated_at", label: "Updated" },
      ]}
    />
  );
}
