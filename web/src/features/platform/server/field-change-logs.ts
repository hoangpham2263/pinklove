import "server-only";

import { query, type DbExecutor } from "@/lib/database";

export type FieldChangeInput = {
  targetType: string;
  targetId: string;
  fieldKey: string;
  oldValue: unknown;
  newValue: unknown;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
};

function valuesEqual(left: unknown, right: unknown) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

export async function recordFieldChanges(changes: FieldChangeInput[], execute: DbExecutor = query) {
  const changed = changes.filter((item) => !valuesEqual(item.oldValue, item.newValue));
  for (const item of changed) {
    await execute(
      `
        INSERT INTO field_change_logs (
          target_type, target_id, field_key, old_value, new_value, actor_id, metadata
        )
        VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7::jsonb)
      `,
      [
        item.targetType,
        item.targetId,
        item.fieldKey,
        JSON.stringify(item.oldValue ?? null),
        JSON.stringify(item.newValue ?? null),
        item.actorId ?? null,
        JSON.stringify(item.metadata ?? {}),
      ]
    );
  }

  return changed.length;
}
