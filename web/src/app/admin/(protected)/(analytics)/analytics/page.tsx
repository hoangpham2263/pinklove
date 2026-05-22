import { ChartNoAxesCombined } from "lucide-react";

import { AdminDatabasePage } from "@/features/admin/components/admin-database-page";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/database";

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const result = await query<Record<string, unknown>>(`
    SELECT
      event.event_name,
      event.target_type,
      event.target_id,
      COUNT(*)::int AS total,
      MAX(event.occurred_at) AS last_seen
    FROM analytics_events event
    GROUP BY event.event_name, event.target_type, event.target_id
    ORDER BY last_seen DESC NULLS LAST
    LIMIT 200
  `);

  return (
    <AdminDatabasePage
      title="Analytics"
      description="Aggregated analytics events for optimization and conversion tracking."
      rows={result.rows}
      icon={ChartNoAxesCombined}
      metricLabel="Event groups"
      columns={[
        { key: "event_name", label: "Event" },
        { key: "target_type", label: "Target type" },
        { key: "target_id", label: "Target ID" },
        { key: "total", label: "Total" },
        { key: "last_seen", label: "Last seen" },
      ]}
    />
  );
}
