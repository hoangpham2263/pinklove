import { Search } from "lucide-react";

import { AdminDatabasePage } from "@/features/admin/components/admin-database-page";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/database";

export default async function AdminOfferingSearchDocumentsPage() {
  await requireAdmin();
  const result = await query<Record<string, unknown>>(`
    SELECT
      doc.offering_id,
      offering.slug,
      offering.name,
      LEFT(doc.search_text, 240) AS search_text,
      doc.filter_json,
      doc.updated_at
    FROM offering_search_documents doc
    INNER JOIN offerings offering ON offering.id = doc.offering_id
    ORDER BY doc.updated_at DESC
  `);

  return (
    <AdminDatabasePage
      title="Offering Search Documents"
      description="Search/index layer cho dynamic offerings."
      rows={result.rows}
      icon={Search}
      metricLabel="Documents"
      columns={[
        { key: "slug", label: "Offering" },
        { key: "name", label: "Name" },
        { key: "search_text", label: "Search text" },
        { key: "filter_json", label: "Filters" },
        { key: "updated_at", label: "Updated" },
      ]}
    />
  );
}
