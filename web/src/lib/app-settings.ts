import"server-only";

import { query } from"@/lib/db";

export type ThemePreset ="pink" |"blue" |"gray" |"green" |"yellow";

export async function getAppTheme(): Promise<ThemePreset> {
 const result = await query<{ theme: ThemePreset }>(
"SELECT theme FROM app_settings WHERE id = 1 LIMIT 1"
 );
 return result.rows[0]?.theme ??"pink";
}

export async function setAppTheme(theme: ThemePreset): Promise<void> {
 await query(
 `
  INSERT INTO app_settings (id, theme)
  VALUES (1, $1)
  ON CONFLICT (id)
  DO UPDATE SET theme = EXCLUDED.theme, updated_at = NOW()
 `,
 [theme]
 );
}
