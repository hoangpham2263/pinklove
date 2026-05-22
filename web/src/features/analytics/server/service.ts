import "server-only";

import { query } from "@/lib/database";

export async function upsertAnalyticsSession(input: {
  visitorToken: string;
  userId?: string;
  referrer?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}) {
  const result = await query<{ id: string }>(
    `
      INSERT INTO analytics_sessions (
        visitor_token, user_id, referrer, user_agent, metadata
      )
      VALUES ($1, $2, $3, $4, $5::jsonb)
      RETURNING id
    `,
    [input.visitorToken, input.userId ?? null, input.referrer ?? "", input.userAgent ?? "", input.metadata ?? {}]
  );

  return result.rows[0]?.id ?? "";
}

export async function recordPageView(input: {
  sessionId?: string;
  path: string;
  title?: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  const result = await query<{ id: string }>(
    `
      INSERT INTO analytics_page_views (
        session_id, path, title, target_type, target_id, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      RETURNING id
    `,
    [input.sessionId ?? null, input.path, input.title ?? "", input.targetType ?? null, input.targetId ?? null, input.metadata ?? {}]
  );

  return result.rows[0]?.id ?? "";
}

export async function recordAnalyticsEvent(input: {
  sessionId?: string;
  pageViewId?: string;
  eventName: string;
  targetType?: string;
  targetId?: string;
  payload?: Record<string, unknown>;
}) {
  await query(
    `
      INSERT INTO analytics_events (
        session_id, page_view_id, event_name, target_type, target_id, payload
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
    `,
    [
      input.sessionId ?? null,
      input.pageViewId ?? null,
      input.eventName,
      input.targetType ?? null,
      input.targetId ?? null,
      input.payload ?? {},
    ]
  );
}
