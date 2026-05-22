import { CalendarClock } from "lucide-react";

import { AdminDatabasePage } from "@/features/admin/components/admin-database-page";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/database";

export default async function AdminProviderAvailabilityPage() {
  await requireAdmin();
  const result = await query<Record<string, unknown>>(`
    SELECT
      slot.id,
      provider.display_name AS provider,
      calendar.label AS calendar,
      slot.starts_at,
      slot.ends_at,
      slot.capacity,
      slot.booked_count,
      slot.status
    FROM provider_time_slots slot
    INNER JOIN providers provider ON provider.id = slot.provider_id
    LEFT JOIN booking_calendars calendar ON calendar.id = slot.calendar_id
    ORDER BY slot.starts_at DESC
    LIMIT 200
  `);

  return (
    <AdminDatabasePage
      title="Provider Availability"
      description="Calendar/time-slot layer cho provider booking."
      rows={result.rows}
      icon={CalendarClock}
      metricLabel="Time slots"
      columns={[
        { key: "provider", label: "Provider" },
        { key: "calendar", label: "Calendar" },
        { key: "starts_at", label: "Starts" },
        { key: "ends_at", label: "Ends" },
        { key: "capacity", label: "Capacity" },
        { key: "booked_count", label: "Booked" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
