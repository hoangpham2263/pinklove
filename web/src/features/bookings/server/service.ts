import "server-only";

import { randomUUID } from "node:crypto";

import { CONVERSION_GOAL_KEYS, recordConversion } from "@/features/analytics/server/conversions";
import { recordDomainEvent } from "@/features/platform/server/domain-events";
import { query, withTransaction } from "@/lib/database";

export type BookingStatus = "draft" | "requested" | "confirmed" | "completed" | "cancelled";

export type BookingListRow = {
  id: string;
  booking_number: string;
  customer: string;
  status: BookingStatus;
  scheduled_at: string | null;
  total_amount: string;
  item_count: number;
  providers: string;
  latest_payment_status: string | null;
  latest_status_note: string | null;
  latest_status_at: string | null;
  created_at: string;
  updated_at: string;
};

type BookingItemInput = {
  offeringId?: string | null;
  providerId?: string | null;
  providerType?: string | null;
  title: string;
  quantity?: number;
  unitPrice?: number;
  metadata?: Record<string, unknown>;
};

function createBookingNumber() {
  return `BK-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

export async function createBooking(input: {
  userId?: string | null;
  status?: BookingStatus;
  scheduledAt?: string | null;
  providerTimeSlotId?: string | null;
  items: BookingItemInput[];
  metadata?: Record<string, unknown>;
  actorUserId?: string | null;
}) {
  const booking = await withTransaction(async (execute) => {
    const totalAmount = input.items.reduce((total, item) => {
      const quantity = Math.max(1, item.quantity ?? 1);
      const unitPrice = Math.max(0, item.unitPrice ?? 0);
      return total + quantity * unitPrice;
    }, 0);

    const bookingResult = await execute<{ id: string; booking_number: string; status: BookingStatus }>(
      `
        INSERT INTO bookings (
          booking_number, user_id, status, scheduled_at, total_amount, metadata
        )
        VALUES ($1, $2, $3, $4::timestamptz, $5, $6::jsonb)
        RETURNING id, booking_number, status
      `,
      [
        createBookingNumber(),
        input.userId ?? null,
        input.status ?? "requested",
        input.scheduledAt ?? null,
        totalAmount,
        JSON.stringify({
          ...(input.metadata ?? {}),
          ...(input.providerTimeSlotId ? { providerTimeSlotId: input.providerTimeSlotId } : {}),
        }),
      ]
    );

    const bookingRow = bookingResult.rows[0];
    if (!bookingRow) throw new Error("BOOKING_CREATE_FAILED");

    for (const item of input.items) {
      const quantity = Math.max(1, item.quantity ?? 1);
      const unitPrice = Math.max(0, item.unitPrice ?? 0);
      await execute(
        `
          INSERT INTO booking_items (
            booking_id, offering_id, provider_type, provider_id, title, quantity, unit_price, line_total, metadata
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
        `,
        [
          bookingRow.id,
          item.offeringId ?? null,
          item.providerType ?? null,
          item.providerId ?? null,
          item.title,
          quantity,
          unitPrice,
          quantity * unitPrice,
          JSON.stringify(item.metadata ?? {}),
        ]
      );
    }

    await execute(
      `
        INSERT INTO booking_status_logs (
          booking_id, actor_user_id, from_status, to_status, note
        )
        VALUES ($1, $2, NULL, $3, $4)
      `,
      [bookingRow.id, input.actorUserId ?? null, bookingRow.status, "Booking created"]
    );

    if (input.providerTimeSlotId) {
      await execute(
        `
          UPDATE provider_time_slots
          SET
            status = CASE WHEN $2 = 'confirmed' THEN 'booked' ELSE 'held' END,
            metadata = provider_time_slots.metadata || $3::jsonb,
            updated_at = NOW()
          WHERE id = $1
        `,
        [
          input.providerTimeSlotId,
          bookingRow.status,
          JSON.stringify({ bookingId: bookingRow.id, bookingNumber: bookingRow.booking_number }),
        ]
      );
    }

    return bookingRow;
  });

  await recordDomainEvent({
    eventName: booking.status === "confirmed" ? "booking.confirmed" : "booking.created",
    aggregateType: "booking",
    aggregateId: booking.id,
    actorType: input.actorUserId ? "user" : "system",
    actorId: input.actorUserId ?? undefined,
    payload: { bookingNumber: booking.booking_number, status: booking.status },
  });
  await recordConversion({
    goalKey: CONVERSION_GOAL_KEYS.BOOKING_CREATED,
    userId: input.userId,
    targetType: "booking",
    targetId: booking.id,
  });

  return booking;
}

const bookingListSelect = `
  SELECT
    booking.id,
    booking.booking_number,
    COALESCE(profile.display_name, account.username, 'Guest') AS customer,
    booking.status,
    booking.scheduled_at::text,
    booking.total_amount::text,
    COUNT(DISTINCT item.id)::int AS item_count,
    COALESCE(string_agg(DISTINCT provider.display_name, ', ') FILTER (WHERE provider.id IS NOT NULL), '') AS providers,
    (
      SELECT payment.status
      FROM booking_payments payment
      WHERE payment.booking_id = booking.id
      ORDER BY payment.created_at DESC
      LIMIT 1
    ) AS latest_payment_status,
    (
      SELECT status_log.note
      FROM booking_status_logs status_log
      WHERE status_log.booking_id = booking.id
      ORDER BY status_log.created_at DESC
      LIMIT 1
    ) AS latest_status_note,
    (
      SELECT status_log.created_at::text
      FROM booking_status_logs status_log
      WHERE status_log.booking_id = booking.id
      ORDER BY status_log.created_at DESC
      LIMIT 1
    ) AS latest_status_at,
    booking.created_at::text,
    booking.updated_at::text
  FROM bookings booking
  LEFT JOIN users account ON account.id = booking.user_id
  LEFT JOIN user_profiles profile ON profile.user_id = account.id
  LEFT JOIN booking_items item ON item.booking_id = booking.id
  LEFT JOIN providers provider ON provider.id = item.provider_id
`;

export async function listBookingsForAdmin() {
  const result = await query<BookingListRow>(
    `
      ${bookingListSelect}
      GROUP BY booking.id, profile.display_name, account.username
      ORDER BY booking.created_at DESC
    `
  );
  return result.rows;
}

export async function listBookingsForCustomer(userId: string) {
  const result = await query<BookingListRow>(
    `
      ${bookingListSelect}
      WHERE booking.user_id = $1
      GROUP BY booking.id, profile.display_name, account.username
      ORDER BY booking.created_at DESC
    `,
    [userId]
  );
  return result.rows;
}

export async function listBookingsForProvider(providerId: string) {
  const result = await query<BookingListRow>(
    `
      ${bookingListSelect}
      WHERE EXISTS (
        SELECT 1
        FROM booking_items provider_item
        WHERE provider_item.booking_id = booking.id
          AND provider_item.provider_id = $1
      )
      GROUP BY booking.id, profile.display_name, account.username
      ORDER BY booking.created_at DESC
    `,
    [providerId]
  );
  return result.rows;
}

export async function providerCanAccessBooking(providerId: string, bookingId: string) {
  const result = await query<{ id: string }>(
    `
      SELECT booking.id
      FROM bookings booking
      INNER JOIN booking_items item ON item.booking_id = booking.id
      WHERE booking.id = $1 AND item.provider_id = $2
      LIMIT 1
    `,
    [bookingId, providerId]
  );
  return Boolean(result.rows[0]);
}

export async function listReviewableBookingProvidersForCustomer(userId: string) {
  const result = await query<Record<string, unknown>>(
    `
      SELECT DISTINCT
        provider.id,
        provider.display_name,
        booking.booking_number,
        booking.status
      FROM bookings booking
      INNER JOIN booking_items item ON item.booking_id = booking.id
      INNER JOIN providers provider ON provider.id = item.provider_id
      WHERE booking.user_id = $1
        AND booking.status IN ('confirmed', 'completed')
      ORDER BY provider.display_name
    `,
    [userId]
  );
  return result.rows;
}

export async function updateBookingStatus(input: {
  bookingId: string;
  nextStatus: BookingStatus;
  actorUserId?: string | null;
  note?: string;
}) {
  const updated = await withTransaction(async (execute) => {
    const existing = await execute<{ status: BookingStatus; metadata: Record<string, unknown> | null }>(
      "SELECT status, metadata FROM bookings WHERE id = $1 LIMIT 1",
      [input.bookingId]
    );
    const current = existing.rows[0];
    if (!current) return null;

    const result = await execute<{ id: string; booking_number: string; status: BookingStatus }>(
      `
        UPDATE bookings
        SET status = $2, updated_at = NOW()
        WHERE id = $1
        RETURNING id, booking_number, status
      `,
      [input.bookingId, input.nextStatus]
    );

    await execute(
      `
        INSERT INTO booking_status_logs (
          booking_id, actor_user_id, from_status, to_status, note
        )
        VALUES ($1, $2, $3, $4, $5)
      `,
      [input.bookingId, input.actorUserId ?? null, current.status, input.nextStatus, input.note ?? ""]
    );

    const providerTimeSlotId = current.metadata?.providerTimeSlotId;
    if (typeof providerTimeSlotId === "string" && providerTimeSlotId) {
      const slotStatus =
        input.nextStatus === "confirmed" ? "booked" :
        input.nextStatus === "cancelled" ? "available" :
        "held";
      await execute(
        `
          UPDATE provider_time_slots
          SET status = $2, updated_at = NOW()
          WHERE id = $1
        `,
        [providerTimeSlotId, slotStatus]
      );
    }

    return result.rows[0] ?? null;
  });

  if (updated) {
    await recordDomainEvent({
      eventName: `booking.${updated.status}`,
      aggregateType: "booking",
      aggregateId: updated.id,
      actorType: input.actorUserId ? "user" : "system",
      actorId: input.actorUserId ?? undefined,
      payload: { bookingNumber: updated.booking_number, status: updated.status },
    });
  }

  return updated;
}

export async function recordBookingPayment(input: {
  bookingId: string;
  provider?: string;
  amount: number;
  status?: "pending" | "paid" | "failed" | "refunded";
  metadata?: Record<string, unknown>;
}) {
  const result = await query<{ id: string }>(
    `
      INSERT INTO booking_payments (
        booking_id, provider, amount, status, metadata
      )
      VALUES ($1, $2, $3, $4, $5::jsonb)
      RETURNING id
    `,
    [
      input.bookingId,
      input.provider ?? "",
      Math.max(0, input.amount),
      input.status ?? "pending",
      JSON.stringify(input.metadata ?? {}),
    ]
  );

  return result.rows[0]?.id ?? "";
}
