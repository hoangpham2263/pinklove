import { Radio } from "lucide-react";

import { AdminDatabasePage } from "@/features/admin/components/admin-database-page";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/database";

export default async function AdminDomainEventsPage() {
  await requireAdmin();
  const result = await query<Record<string, unknown>>(`
    SELECT
      event_name,
      aggregate_type,
      aggregate_id,
      actor_type,
      actor_id,
      payload,
      occurred_at
    FROM domain_events
    ORDER BY occurred_at DESC
    LIMIT 200
  `);

  return (
    <AdminDatabasePage
      title="Domain Events"
      description="Durable business event stream for notifications, automation, analytics, and sync."
      rows={result.rows}
      icon={Radio}
      metricLabel="Recent events"
      columns={[
        { key: "event_name", label: "Event" },
        { key: "aggregate_type", label: "Aggregate" },
        { key: "aggregate_id", label: "Aggregate ID" },
        { key: "actor_type", label: "Actor" },
        { key: "actor_id", label: "Actor ID" },
        { key: "payload", label: "Payload" },
        { key: "occurred_at", label: "Occurred" },
      ]}
    />
  );
}
