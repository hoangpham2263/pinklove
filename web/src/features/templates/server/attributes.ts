import "server-only";

import { query, withTransaction } from "@/lib/database";

export async function saveTemplateAttribute(input: {
  key: string;
  label: string;
  attributeType: "style" | "theme" | "mood" | "culture" | "season" | "color" | "event_type";
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}) {
  const result = await query<{ id: string }>(
    `
      INSERT INTO template_attributes (
        key, label, attribute_type, sort_order, metadata
      )
      VALUES ($1, $2, $3, $4, $5::jsonb)
      ON CONFLICT (key) DO UPDATE
      SET
        label = EXCLUDED.label,
        attribute_type = EXCLUDED.attribute_type,
        sort_order = EXCLUDED.sort_order,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING id
    `,
    [input.key, input.label, input.attributeType, input.sortOrder ?? 0, input.metadata ?? {}]
  );

  return result.rows[0]?.id ?? "";
}

export async function setTemplateAttributeValues(input: {
  offeringId: string;
  values: Array<{
    attributeKey: string;
    attributeLabel?: string;
    attributeType: "style" | "theme" | "mood" | "culture" | "season" | "color" | "event_type";
    valueKey: string;
    valueLabel: string;
    sortOrder?: number;
    metadata?: Record<string, unknown>;
  }>;
}) {
  await withTransaction(async (execute) => {
    await execute("DELETE FROM template_attribute_values WHERE offering_id = $1", [input.offeringId]);

    for (const [index, value] of input.values.entries()) {
      const attributeResult = await execute<{ id: string }>(
        `
          INSERT INTO template_attributes (key, label, attribute_type)
          VALUES ($1, $2, $3)
          ON CONFLICT (key) DO UPDATE
          SET label = EXCLUDED.label, attribute_type = EXCLUDED.attribute_type, updated_at = NOW()
          RETURNING id
        `,
        [value.attributeKey, value.attributeLabel ?? value.attributeKey, value.attributeType]
      );
      const attributeId = attributeResult.rows[0]?.id;
      if (!attributeId) continue;

      await execute(
        `
          INSERT INTO template_attribute_values (
            attribute_id, offering_id, value_key, value_label, sort_order, metadata
          )
          VALUES ($1, $2, $3, $4, $5, $6::jsonb)
        `,
        [attributeId, input.offeringId, value.valueKey, value.valueLabel, value.sortOrder ?? index, value.metadata ?? {}]
      );
    }
  });
}

export async function listTemplateAttributesForOffering(offeringId: string) {
  const result = await query(
    `
      SELECT
        attr.key AS attribute_key,
        attr.label AS attribute_label,
        attr.attribute_type,
        value.value_key,
        value.value_label,
        value.sort_order,
        value.metadata
      FROM template_attribute_values value
      INNER JOIN template_attributes attr ON attr.id = value.attribute_id
      WHERE value.offering_id = $1
      ORDER BY attr.sort_order ASC, value.sort_order ASC
    `,
    [offeringId]
  );

  return result.rows;
}
