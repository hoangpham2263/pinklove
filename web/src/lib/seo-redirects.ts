import "server-only";

import { getSystemSettings, type SeoRedirectRule } from "@/lib/system-settings";
import { query } from "@/lib/database";

type SeoRedirectRow = {
  id: string;
  source_path: string;
  target_path: string;
  status_code: number;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export function normalizeSeoRedirectSource(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const pathOnly = trimmed.split("#")[0]?.split("?")[0] ?? trimmed;
  const collapsed = pathOnly.replace(/\/{2,}/g, "/");
  const normalized = collapsed.startsWith("/") ? collapsed : `/${collapsed}`;
  return normalized.length > 1 ? normalized.replace(/\/+$/g, "") : normalized;
}

export function normalizeSeoRedirectTarget(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const collapsed = trimmed.replace(/\/{2,}/g, "/");
  const normalized = collapsed.startsWith("/") ? collapsed : `/${collapsed}`;
  return normalized.length > 1 ? normalized.replace(/\/+$/g, "") : normalized;
}

export function isValidSeoRedirectTarget(input: string) {
  return input.startsWith("/") || /^https?:\/\//i.test(input);
}

function toIsoDate(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapSeoRedirectRow(row: SeoRedirectRow): SeoRedirectRule {
  return {
    id: row.id,
    sourcePath: row.source_path,
    targetPath: row.target_path,
    statusCode: row.status_code === 302 ? 302 : 301,
    enabled: row.is_active,
    label: String(row.metadata?.label ?? ""),
    createdAt: toIsoDate(row.created_at),
    updatedAt: toIsoDate(row.updated_at),
  };
}

export async function listSeoRedirectRules(): Promise<SeoRedirectRule[]> {
  try {
    const result = await query<SeoRedirectRow>(`
      SELECT id, source_path, target_path, status_code, is_active, metadata, created_at, updated_at
      FROM seo_redirects
      ORDER BY updated_at DESC, created_at DESC
    `);

    if (result.rows.length > 0) {
      return result.rows.map(mapSeoRedirectRow);
    }
  } catch {
    return (await getSystemSettings()).redirects.rules;
  }

  return (await getSystemSettings()).redirects.rules;
}

export async function getSeoRedirectRuleById(id: string): Promise<SeoRedirectRule | null> {
  const result = await query<SeoRedirectRow>(
    `
    SELECT id, source_path, target_path, status_code, is_active, metadata, created_at, updated_at
    FROM seo_redirects
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0] ? mapSeoRedirectRow(result.rows[0]) : null;
}

export async function getSeoRedirectRuleBySourcePath(sourcePath: string): Promise<SeoRedirectRule | null> {
  const result = await query<SeoRedirectRow>(
    `
    SELECT id, source_path, target_path, status_code, is_active, metadata, created_at, updated_at
    FROM seo_redirects
    WHERE source_path = $1
    LIMIT 1
    `,
    [normalizeSeoRedirectSource(sourcePath)]
  );

  return result.rows[0] ? mapSeoRedirectRow(result.rows[0]) : null;
}

export async function saveSeoRedirectRule(rule: SeoRedirectRule): Promise<SeoRedirectRule> {
  const result = await query<SeoRedirectRow>(
    `
    INSERT INTO seo_redirects (id, source_path, target_path, status_code, is_active, metadata, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::timestamptz, NOW())
    ON CONFLICT (id) DO UPDATE
    SET source_path = EXCLUDED.source_path,
        target_path = EXCLUDED.target_path,
        status_code = EXCLUDED.status_code,
        is_active = EXCLUDED.is_active,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    RETURNING id, source_path, target_path, status_code, is_active, metadata, created_at, updated_at
    `,
    [
      rule.id,
      rule.sourcePath,
      rule.targetPath,
      rule.statusCode,
      rule.enabled,
      JSON.stringify({ label: rule.label }),
      rule.createdAt,
    ]
  );

  return mapSeoRedirectRow(result.rows[0]);
}

export async function deleteSeoRedirectRule(id: string) {
  await query("DELETE FROM seo_redirects WHERE id = $1", [id]);
}

export async function getSeoRedirectForPath(pathname: string): Promise<SeoRedirectRule | null> {
  const normalizedPath = normalizeSeoRedirectSource(pathname);
  if (!normalizedPath) return null;

  try {
    const result = await query<SeoRedirectRow>(
      `
      SELECT id, source_path, target_path, status_code, is_active, metadata, created_at, updated_at
      FROM seo_redirects
      WHERE source_path = $1
        AND is_active = TRUE
      LIMIT 1
      `,
      [normalizedPath]
    );

    if (result.rows[0]) {
      return mapSeoRedirectRow(result.rows[0]);
    }
  } catch {
    return (await getSystemSettings()).redirects.rules.find(
      (rule) => rule.enabled && normalizeSeoRedirectSource(rule.sourcePath) === normalizedPath
    ) ?? null;
  }

  return (await getSystemSettings()).redirects.rules.find(
    (rule) => rule.enabled && normalizeSeoRedirectSource(rule.sourcePath) === normalizedPath
  ) ?? null;
}
