import "server-only";

import { query } from "@/lib/database";
import type { PageFields } from "@/lib/page-fields";

type AppSettingsRow = {
  global_fields_config?: Record<string, unknown> | null;
};

export async function getGlobalFields<TFields extends PageFields = PageFields>(): Promise<TFields> {
  if (!process.env.DATABASE_URL) {
    return {} as TFields;
  }

  try {
    const result = await query<AppSettingsRow>(
      `
      SELECT global_fields_config
      FROM app_settings
      WHERE id = 1
      LIMIT 1
      `
    );

    return ((result.rows[0]?.global_fields_config as TFields | undefined) ?? ({} as TFields));
  } catch {
    return {} as TFields;
  }
}

export async function updateGlobalFields(input: Record<string, unknown>) {
  const current = await getGlobalFields();
  const next = { ...current, ...input };

  await query(
    `
    UPDATE app_settings
    SET global_fields_config = $1::jsonb,
        updated_at = NOW()
    WHERE id = 1
    `,
    [JSON.stringify(next)]
  );

  return next;
}
