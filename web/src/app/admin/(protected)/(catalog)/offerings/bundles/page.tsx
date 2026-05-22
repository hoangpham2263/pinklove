import { Boxes } from "lucide-react";

import { AdminDatabasePage } from "@/features/admin/components/admin-database-page";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/database";

export default async function AdminOfferingBundlesPage() {
  await requireAdmin();
  const result = await query<Record<string, unknown>>(`
    SELECT
      bundle.id,
      bundle.slug,
      bundle.name,
      bundle.status,
      bundle.price::text AS price,
      bundle.currency,
      COUNT(item.id)::int AS item_count,
      bundle.updated_at
    FROM offering_bundles bundle
    LEFT JOIN offering_bundle_items item ON item.bundle_id = bundle.id
    GROUP BY bundle.id
    ORDER BY bundle.updated_at DESC
  `);

  return (
    <AdminDatabasePage
      title="Offering Bundles"
      description="Quản lý kiến trúc package/bundle cho wedding commerce."
      rows={result.rows}
      icon={Boxes}
      metricLabel="Bundles"
      columns={[
        { key: "slug", label: "Slug" },
        { key: "name", label: "Name" },
        { key: "status", label: "Status" },
        { key: "price", label: "Price" },
        { key: "currency", label: "Currency" },
        { key: "item_count", label: "Items" },
        { key: "updated_at", label: "Updated" },
      ]}
    />
  );
}
