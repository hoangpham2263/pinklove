import "server-only";

import type { ProviderAvailabilityKind } from "@/features/providers/config/availability";
import { query } from "@/lib/database";

export type { ProviderAvailabilityKind };

export type ProviderSchedulableService = {
  providerServiceId: string | null;
  offeringId: string;
  title: string;
  offeringName: string;
  fulfillmentType: string;
  serviceKind: string | null;
  serviceLocationMode: string;
  durationMinutes: number;
};

export async function ensureBookingCalendar(input: {
  providerId: string;
  name?: string;
  timezone?: string;
  settings?: Record<string, unknown>;
}) {
  const result = await query<{ id: string }>(
    `
      INSERT INTO booking_calendars (
        provider_id, key, label, timezone, config
      )
      VALUES ($1, $2, $3, $4, $5::jsonb)
      ON CONFLICT (provider_id, key) DO UPDATE
      SET label = EXCLUDED.label, timezone = EXCLUDED.timezone, config = EXCLUDED.config, updated_at = NOW()
      RETURNING id
    `,
    [
      input.providerId,
      input.name ? input.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "default" : "default",
      input.name ?? "Default",
      input.timezone ?? "Asia/Ho_Chi_Minh",
      input.settings ?? {},
    ]
  );

  return result.rows[0]?.id ?? "";
}

export async function saveProviderAvailability(input: {
  providerId: string;
  calendarId?: string;
  providerServiceId?: string;
  offeringId?: string;
  availabilityKind?: ProviderAvailabilityKind;
  dayOfWeek?: number;
  startsAt?: string;
  endsAt?: string;
  durationMinutes?: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  capacity?: number;
  status?: "available" | "unavailable" | "blocked";
  metadata?: Record<string, unknown>;
}) {
  const result = await query<{ id: string }>(
    `
      INSERT INTO provider_availability (
        provider_id,
        calendar_id,
        provider_service_id,
        offering_id,
        availability_kind,
        day_of_week,
        starts_at,
        ends_at,
        duration_minutes,
        buffer_before_minutes,
        buffer_after_minutes,
        capacity,
        status,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7, '')::time, NULLIF($8, '')::time, $9, $10, $11, $12, $13, $14::jsonb)
      RETURNING id
    `,
    [
      input.providerId,
      input.calendarId ?? null,
      input.providerServiceId ?? null,
      input.offeringId ?? null,
      input.availabilityKind ?? "general",
      input.dayOfWeek ?? null,
      input.startsAt ?? "",
      input.endsAt ?? "",
      Math.max(0, input.durationMinutes ?? 0),
      Math.max(0, input.bufferBeforeMinutes ?? 0),
      Math.max(0, input.bufferAfterMinutes ?? 0),
      Math.max(1, input.capacity ?? 1),
      input.status ?? "available",
      input.metadata ?? {},
    ]
  );

  return result.rows[0]?.id ?? "";
}

export type ProviderAvailabilityRule = {
  id: string;
  providerId: string;
  calendarId: string | null;
  calendarLabel: string | null;
  providerServiceId: string | null;
  offeringId: string | null;
  offeringName: string | null;
  serviceTitle: string | null;
  fulfillmentType: string | null;
  serviceKind: string | null;
  availabilityKind: ProviderAvailabilityKind;
  dayOfWeek: number | null;
  startsAt: string | null;
  endsAt: string | null;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  capacity: number;
  status: "available" | "unavailable" | "blocked";
  createdAt: string;
  updatedAt: string;
};

export async function listProviderAvailabilityRules(providerId: string): Promise<ProviderAvailabilityRule[]> {
  const result = await query<{
    id: string;
    provider_id: string;
    calendar_id: string | null;
    calendar_label: string | null;
    provider_service_id: string | null;
    offering_id: string | null;
    offering_name: string | null;
    service_title: string | null;
    fulfillment_type: string | null;
    service_kind: string | null;
    availability_kind: ProviderAvailabilityKind;
    day_of_week: number | null;
    starts_at: string | null;
    ends_at: string | null;
    duration_minutes: number;
    buffer_before_minutes: number;
    buffer_after_minutes: number;
    capacity: number;
    status: ProviderAvailabilityRule["status"];
    created_at: string;
    updated_at: string;
  }>(
    `
      SELECT
        availability.id,
        availability.provider_id,
        availability.calendar_id,
        calendar.label AS calendar_label,
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
        availability.duration_minutes,
        availability.buffer_before_minutes,
        availability.buffer_after_minutes,
        availability.capacity,
        availability.status,
        availability.created_at,
        availability.updated_at
      FROM provider_availability availability
      LEFT JOIN booking_calendars calendar ON calendar.id = availability.calendar_id
      LEFT JOIN provider_services service ON service.id = availability.provider_service_id
      LEFT JOIN offerings offering ON offering.id = COALESCE(availability.offering_id, service.offering_id)
      LEFT JOIN service_offerings service_offering ON service_offering.offering_id = offering.id
      WHERE availability.provider_id = $1
      ORDER BY availability.day_of_week ASC NULLS LAST, availability.starts_at ASC NULLS LAST, offering.name ASC NULLS LAST, availability.created_at DESC
    `,
    [providerId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    providerId: row.provider_id,
    calendarId: row.calendar_id,
    calendarLabel: row.calendar_label,
    providerServiceId: row.provider_service_id,
    offeringId: row.offering_id,
    offeringName: row.offering_name,
    serviceTitle: row.service_title,
    fulfillmentType: row.fulfillment_type,
    serviceKind: row.service_kind,
    availabilityKind: row.availability_kind,
    dayOfWeek: row.day_of_week,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    durationMinutes: row.duration_minutes,
    bufferBeforeMinutes: row.buffer_before_minutes,
    bufferAfterMinutes: row.buffer_after_minutes,
    capacity: row.capacity,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function updateProviderAvailabilityRule(input: {
  providerId: string;
  ruleId: string;
  providerServiceId?: string | null;
  offeringId?: string | null;
  availabilityKind?: ProviderAvailabilityKind;
  dayOfWeek?: number;
  startsAt?: string;
  endsAt?: string;
  durationMinutes?: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  capacity?: number;
  status?: "available" | "unavailable" | "blocked";
  metadata?: Record<string, unknown>;
}) {
  const result = await query(
    `
      UPDATE provider_availability
      SET
        provider_service_id = $3,
        offering_id = $4,
        availability_kind = COALESCE($5, availability_kind),
        day_of_week = COALESCE($6, day_of_week),
        starts_at = COALESCE(NULLIF($7, '')::time, starts_at),
        ends_at = COALESCE(NULLIF($8, '')::time, ends_at),
        duration_minutes = COALESCE($9, duration_minutes),
        buffer_before_minutes = COALESCE($10, buffer_before_minutes),
        buffer_after_minutes = COALESCE($11, buffer_after_minutes),
        capacity = COALESCE($12, capacity),
        status = COALESCE($13, status),
        metadata = COALESCE($14::jsonb, metadata),
        updated_at = NOW()
      WHERE id = $1 AND provider_id = $2
    `,
    [
      input.ruleId,
      input.providerId,
      input.providerServiceId ?? null,
      input.offeringId ?? null,
      input.availabilityKind ?? null,
      input.dayOfWeek ?? null,
      input.startsAt ?? "",
      input.endsAt ?? "",
      input.durationMinutes !== undefined ? Math.max(0, input.durationMinutes) : null,
      input.bufferBeforeMinutes !== undefined ? Math.max(0, input.bufferBeforeMinutes) : null,
      input.bufferAfterMinutes !== undefined ? Math.max(0, input.bufferAfterMinutes) : null,
      input.capacity !== undefined ? Math.max(1, input.capacity) : null,
      input.status ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null,
    ]
  );

  return (result.rowCount ?? 0) > 0;
}

export async function deleteProviderAvailabilityRule(providerId: string, ruleId: string) {
  const result = await query(
    `
      DELETE FROM provider_availability
      WHERE id = $1 AND provider_id = $2
    `,
    [ruleId, providerId]
  );

  return (result.rowCount ?? 0) > 0;
}

export async function saveProviderTimeSlot(input: {
  providerId: string;
  calendarId?: string;
  offeringId?: string;
  availabilityId?: string;
  providerServiceId?: string;
  availabilityKind?: ProviderAvailabilityKind;
  startsAt: string;
  endsAt: string;
  status?: "available" | "held" | "booked" | "blocked";
  metadata?: Record<string, unknown>;
}) {
  const result = await query<{ id: string }>(
    `
      INSERT INTO provider_time_slots (
        provider_id, calendar_id, availability_id, provider_service_id, offering_id, availability_kind, starts_at, ends_at, status, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz, $9, $10::jsonb)
      RETURNING id
    `,
    [
      input.providerId,
      input.calendarId ?? null,
      input.availabilityId ?? null,
      input.providerServiceId ?? null,
      input.offeringId ?? null,
      input.availabilityKind ?? "general",
      input.startsAt,
      input.endsAt,
      input.status ?? "available",
      input.metadata ?? {},
    ]
  );

  return result.rows[0]?.id ?? "";
}

export async function listProviderSchedulableServices(providerId: string): Promise<ProviderSchedulableService[]> {
  const result = await query<{
    provider_service_id: string | null;
    offering_id: string;
    title: string | null;
    offering_name: string;
    fulfillment_type: string;
    service_kind: string | null;
    service_location_mode: string | null;
    duration_minutes: number | null;
  }>(
    `
      WITH service_rows AS (
        SELECT
          service.id AS provider_service_id,
          offering.id AS offering_id,
          service.title,
          offering.name AS offering_name,
          offering.fulfillment_type,
          service_offering.service_kind,
          COALESCE(service.metadata ->> 'service_location_mode', service_offering.service_kind, offering.fulfillment_type) AS service_location_mode,
          COALESCE(NULLIF(service.metadata ->> 'duration_minutes', '')::int, service_offering.duration_minutes, 0) AS duration_minutes
        FROM provider_services service
        INNER JOIN offerings offering ON offering.id = service.offering_id
        LEFT JOIN service_offerings service_offering ON service_offering.offering_id = offering.id
        WHERE service.provider_id = $1
          AND service.status = 'active'
          AND offering.fulfillment_type = 'service'

        UNION ALL

        SELECT
          NULL AS provider_service_id,
          offering.id AS offering_id,
          offering.name AS title,
          offering.name AS offering_name,
          offering.fulfillment_type,
          service_offering.service_kind,
          COALESCE(service_offering.service_kind, offering.fulfillment_type) AS service_location_mode,
          COALESCE(service_offering.duration_minutes, 0) AS duration_minutes
        FROM physical_offerings physical
        INNER JOIN offerings offering ON offering.id = physical.offering_id
        LEFT JOIN service_offerings service_offering ON service_offering.offering_id = offering.id
        WHERE physical.provider_id = $1
          AND COALESCE(physical.fulfillment_type, offering.fulfillment_type) = 'service'
          AND offering.status = 'published'
      )
      SELECT DISTINCT ON (offering_id)
        provider_service_id,
        offering_id,
        title,
        offering_name,
        fulfillment_type,
        service_kind,
        service_location_mode,
        duration_minutes
      FROM service_rows
      ORDER BY offering_id, provider_service_id NULLS LAST
    `,
    [providerId]
  );

  return result.rows.map((row) => ({
    providerServiceId: row.provider_service_id,
    offeringId: row.offering_id,
    title: row.title || row.offering_name,
    offeringName: row.offering_name,
    fulfillmentType: row.fulfillment_type,
    serviceKind: row.service_kind,
    serviceLocationMode: row.service_location_mode ?? "general",
    durationMinutes: row.duration_minutes ?? 0,
  }));
}

export async function getProviderAvailabilityServiceScope(input: {
  providerId: string;
  providerServiceId?: string;
  offeringId?: string;
}): Promise<{ providerServiceId: string | null; offeringId: string | null; durationMinutes: number } | null> {
  const services = await listProviderSchedulableServices(input.providerId);
  if (!input.providerServiceId && !input.offeringId) {
    return null;
  }

  const service = services.find((item) =>
    input.providerServiceId ? item.providerServiceId === input.providerServiceId : item.offeringId === input.offeringId
  );

  if (!service) return null;
  return {
    providerServiceId: service.providerServiceId,
    offeringId: service.offeringId,
    durationMinutes: service.durationMinutes,
  };
}
