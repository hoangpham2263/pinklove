import { CalendarClock } from "lucide-react";

import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/database";
import { ProviderAvailabilityTable, type ProviderAvailabilityRow } from "./provider-availability-table";

export default async function AdminProviderAvailabilityPage() {
  await requireAdmin();
  const result = await query<ProviderAvailabilityRow>(`
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
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lịch provider</h1>
        <p className="text-sm text-muted-foreground">Trang chỉ để admin xem/kiểm tra time slot. Provider tự khai báo lịch trong portal.</p>
      </div>

      <AdminOverviewGrid className="md:grid-cols-1 lg:grid-cols-1">
        <AdminOverviewCard title="Time slots" value={result.rows.length} icon={CalendarClock} />
      </AdminOverviewGrid>

      <ProviderAvailabilityTable rows={result.rows} />
    </section>
  );
}
