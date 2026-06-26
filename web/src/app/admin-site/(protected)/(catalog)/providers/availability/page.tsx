import { CalendarClock } from "lucide-react";

import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/database";
import { ProviderAvailabilityTable, type ProviderAvailabilityRow } from "./provider-availability-table";

export default async function AdminProviderAvailabilityPage() {
  await requireAdmin();
  const result = await query<ProviderAvailabilityRow>(`
    SELECT
      availability.id,
      provider.id AS provider_id,
      provider.display_name AS provider,
      provider.provider_type,
      calendar.label AS calendar,
      availability.provider_service_id,
      availability.offering_id,
      offering.name AS offering_name,
      service.title AS service_title,
      offering.fulfillment_type,
      service_offering.service_kind,
      availability.availability_kind,
      availability.day_of_week,
      availability.starts_at::text,
      availability.ends_at::text,
      availability.valid_from::text,
      availability.valid_until::text,
      availability.capacity,
      availability.status,
      availability.updated_at::text
    FROM provider_availability availability
    INNER JOIN providers provider ON provider.id = availability.provider_id
    LEFT JOIN booking_calendars calendar ON calendar.id = availability.calendar_id
    LEFT JOIN provider_services service ON service.id = availability.provider_service_id
    LEFT JOIN offerings offering ON offering.id = COALESCE(availability.offering_id, service.offering_id)
    LEFT JOIN service_offerings service_offering ON service_offering.offering_id = offering.id
    ORDER BY provider.display_name ASC, availability.day_of_week ASC NULLS LAST, availability.starts_at ASC NULLS LAST
    LIMIT 200
  `);
  const providerCount = new Set(result.rows.map((row) => row.provider_id)).size;
  const availableCount = result.rows.filter((row) => row.status === "available").length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lịch provider</h1>
        <p className="text-sm text-muted-foreground">Trang chỉ để admin xem/kiểm tra lịch provider đã tự khai báo trong portal.</p>
      </div>

      <AdminOverviewGrid className="md:grid-cols-3 lg:grid-cols-3">
        <AdminOverviewCard title="Lịch khai báo" value={result.rows.length} icon={CalendarClock} />
        <AdminOverviewCard title="Provider có lịch" value={providerCount} icon={CalendarClock} />
        <AdminOverviewCard title="Khung khả dụng" value={availableCount} icon={CalendarClock} />
      </AdminOverviewGrid>

      <ProviderAvailabilityTable rows={result.rows} />
    </section>
  );
}
