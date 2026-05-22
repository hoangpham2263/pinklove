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
  status?: "available" | "unavailable" | "blocked";
  metadata?: Record<string, unknown>;
}) {
  const result = await query<{ id: string }>(
    `
      INSERT INTO provider_availability (
        provider_id, calendar_id, day_of_week, starts_at, ends_at, status, metadata
      )
      VALUES ($1, $2, $3, NULLIF($4, '')::time, NULLIF($5, '')::time, $6, $7::jsonb)
      RETURNING id
    `,
    [
      input.providerId,
      input.calendarId ?? null,
      input.dayOfWeek ?? null,
      input.startsAt ?? "",
      input.endsAt ?? "",
      input.status ?? "available",
      input.metadata ?? {},
    ]
  );

  return result.rows[0]?.id ?? "";
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
