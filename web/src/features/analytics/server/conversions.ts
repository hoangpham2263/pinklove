import "server-only";

import { query } from "@/lib/database";

export const CONVERSION_GOAL_KEYS = {
  RSVP_SUBMITTED: "rsvp_submitted",
  LEAD_CREATED: "lead_created",
  BOOKING_CREATED: "booking_created",
  CHECKOUT_SUCCESS: "checkout_success",
  CONTACT_VENDOR: "contact_vendor",
} as const;

export async function getConversionReport() {
  const [goals, events] = await Promise.all([
    query<{
      id: string;
      key: string;
      label: string;
      target_type: string;
      is_active: boolean;
      event_count: number;
    }>(
      `
        SELECT
          goal.id,
          goal.key,
          goal.label,
          goal.target_type,
          goal.is_active,
          COUNT(event.id)::int AS event_count
        FROM conversion_goals goal
        LEFT JOIN conversion_events event ON event.goal_id = goal.id
        GROUP BY goal.id
        ORDER BY goal.label
      `
    ),
    query<{
      id: string;
      goal_label: string;
      target_type: string;
      target_id: string | null;
      user_id: string | null;
      created_at: string;
    }>(
      `
        SELECT event.*, goal.label AS goal_label
        FROM conversion_events event
        INNER JOIN conversion_goals goal ON goal.id = event.goal_id
        ORDER BY event.created_at DESC
        LIMIT 100
      `
    ),
  ]);

  return { goals: goals.rows, events: events.rows };
}

export async function listConversionEventGroups() {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        goal.key AS event_name,
        conversion.target_type,
        conversion.target_id,
        COUNT(*)::int AS total,
        MAX(conversion.created_at) AS last_seen
      FROM conversion_events conversion
      INNER JOIN conversion_goals goal ON goal.id = conversion.goal_id
      GROUP BY goal.key, conversion.target_type, conversion.target_id
      ORDER BY last_seen DESC NULLS LAST
      LIMIT 200
    `
  );
  return result.rows;
}

export async function recordConversion(input: {
  goalKey: (typeof CONVERSION_GOAL_KEYS)[keyof typeof CONVERSION_GOAL_KEYS];
  sessionId?: string | null;
  userId?: string | null;
  targetType: string;
  targetId?: string | null;
}) {
  const result = await query<{ id: string }>(
    `
      INSERT INTO conversion_events (
        goal_id, session_id, user_id, target_type, target_id
      )
      SELECT goal.id, $2, $3, $4, $5
      FROM conversion_goals goal
      WHERE goal.key = $1 AND goal.is_active = TRUE
        AND NOT EXISTS (
          SELECT 1
          FROM conversion_events existing
          WHERE existing.goal_id = goal.id
            AND existing.user_id IS NOT DISTINCT FROM $3::text
            AND existing.target_type = $4
            AND existing.target_id IS NOT DISTINCT FROM $5::text
        )
      RETURNING id
    `,
    [
      input.goalKey,
      input.sessionId ?? null,
      input.userId ?? null,
      input.targetType,
      input.targetId ?? null,
    ]
  );

  return result.rows[0]?.id ?? "";
}
