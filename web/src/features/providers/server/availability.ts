import "server-only";

import { query } from "@/lib/database";

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
  dayOfWeek?: number;
  startsAt?: string;
  endsAt?: string;
  capacity?: number;
  status?: "available" | "unavailable" | "blocked";
  metadata?: Record<string, unknown>;
}) {
  const result = await query<{ id: string }>(
    `
      INSERT INTO provider_availability (
        provider_id, calendar_id, day_of_week, starts_at, ends_at, capacity, status, metadata
      )
      VALUES ($1, $2, $3, NULLIF($4, '')::time, NULLIF($5, '')::time, $6, $7, $8::jsonb)
      RETURNING id
    `,
    [
      input.providerId,
      input.calendarId ?? null,
      input.dayOfWeek ?? null,
      input.startsAt ?? "",
      input.endsAt ?? "",
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
  dayOfWeek: number | null;
  startsAt: string | null;
  endsAt: string | null;
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
    day_of_week: number | null;
    starts_at: string | null;
    ends_at: string | null;
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
        availability.day_of_week,
        availability.starts_at::text,
        availability.ends_at::text,
        availability.capacity,
        availability.status,
        availability.created_at,
        availability.updated_at
      FROM provider_availability availability
      LEFT JOIN booking_calendars calendar ON calendar.id = availability.calendar_id
      WHERE availability.provider_id = $1
      ORDER BY availability.day_of_week ASC NULLS LAST, availability.starts_at ASC NULLS LAST, availability.created_at DESC
    `,
    [providerId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    providerId: row.provider_id,
    calendarId: row.calendar_id,
    calendarLabel: row.calendar_label,
    dayOfWeek: row.day_of_week,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    capacity: row.capacity,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function updateProviderAvailabilityRule(input: {
  providerId: string;
  ruleId: string;
  dayOfWeek?: number;
  startsAt?: string;
  endsAt?: string;
  capacity?: number;
  status?: "available" | "unavailable" | "blocked";
  metadata?: Record<string, unknown>;
}) {
  await query(
    `
      UPDATE provider_availability
      SET
        day_of_week = COALESCE($3, day_of_week),
        starts_at = COALESCE(NULLIF($4, '')::time, starts_at),
        ends_at = COALESCE(NULLIF($5, '')::time, ends_at),
        capacity = COALESCE($6, capacity),
        status = COALESCE($7, status),
        metadata = COALESCE($8::jsonb, metadata),
        updated_at = NOW()
      WHERE id = $1 AND provider_id = $2
    `,
    [
      input.ruleId,
      input.providerId,
      input.dayOfWeek ?? null,
      input.startsAt ?? "",
      input.endsAt ?? "",
      input.capacity !== undefined ? Math.max(1, input.capacity) : null,
      input.status ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null,
    ]
  );
}

export async function deleteProviderAvailabilityRule(providerId: string, ruleId: string) {
  await query(
    `
      DELETE FROM provider_availability
      WHERE id = $1 AND provider_id = $2
    `,
    [ruleId, providerId]
  );
}

export async function saveProviderTimeSlot(input: {
  providerId: string;
  calendarId?: string;
  offeringId?: string;
  startsAt: string;
  endsAt: string;
  status?: "available" | "held" | "booked" | "blocked";
  metadata?: Record<string, unknown>;
}) {
  const result = await query<{ id: string }>(
    `
      INSERT INTO provider_time_slots (
        provider_id, calendar_id, offering_id, starts_at, ends_at, status, metadata
      )
      VALUES ($1, $2, $3, $4::timestamptz, $5::timestamptz, $6, $7::jsonb)
      RETURNING id
    `,
    [
      input.providerId,
      input.calendarId ?? null,
      input.offeringId ?? null,
      input.startsAt,
      input.endsAt,
      input.status ?? "available",
      input.metadata ?? {},
    ]
  );

  return result.rows[0]?.id ?? "";
}
