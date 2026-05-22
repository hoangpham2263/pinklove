import "server-only";

import { query } from "@/lib/database";

export async function recordDomainEvent(input: {
  eventName: string;
  aggregateType: string;
  aggregateId: string;
  actorType?: string;
  actorId?: string;
  payload?: Record<string, unknown>;
}) {
  await query(
    `
      INSERT INTO domain_events (
        event_name, aggregate_type, aggregate_id, actor_type, actor_id, payload
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
    `,
    [
      input.eventName,
      input.aggregateType,
      input.aggregateId,
      input.actorType ?? null,
      input.actorId ?? null,
      input.payload ?? {},
    ]
  );
}
