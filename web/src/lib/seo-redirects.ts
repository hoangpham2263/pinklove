import "server-only";

import { query } from "@/lib/database";

export type SeoRedirectRule = {
  id: string;
  sourcePath: string;
  targetPath: string;
  statusCode: 301 | 302;
  enabled: boolean;
  label: string;
  createdAt: string;
  updatedAt: string;
};

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
  const normalized = pathOnly.replace(/\/{2,}/g, "/");
  const withLeadingSlash = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/g, "") : withLeadingSlash;
}

export function normalizeSeoRedirectTarget(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const normalized = trimmed.replace(/\/{2,}/g, "/");
  const withLeadingSlash = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/g, "") : withLeadingSlash;
}

export function isValidSeoRedirectTarget(input: string) {
  return input.startsWith("/") || /^https?:\/\//i.test(input);
}

function mapRule(row: SeoRedirectRow): SeoRedirectRule {
  return {
    id: row.id,
    sourcePath: row.source_path,
    targetPath: row.target_path,
    statusCode: row.status_code === 302 ? 302 : 301,
    enabled: row.is_active,
    label: String(row.metadata?.label ?? ""),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function listSeoRedirectRules() {
  const result = await query<SeoRedirectRow>(`
    SELECT id, source_path, target_path, status_code, is_active, metadata, created_at, updated_at
    FROM seo_redirects
    ORDER BY updated_at DESC, created_at DESC
  `);
  return result.rows.map(mapRule);
}

export async function getSeoRedirectRuleById(id: string) {
  const result = await query<SeoRedirectRow>(
    `
      SELECT id, source_path, target_path, status_code, is_active, metadata, created_at, updated_at
      FROM seo_redirects
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );
  return result.rows[0] ? mapRule(result.rows[0]) : null;
}

export async function getSeoRedirectRuleBySourcePath(sourcePath: string) {
  const result = await query<SeoRedirectRow>(
    `
      SELECT id, source_path, target_path, status_code, is_active, metadata, created_at, updated_at
      FROM seo_redirects
      WHERE source_path = $1
      LIMIT 1
    `,
    [normalizeSeoRedirectSource(sourcePath)]
  );
  return result.rows[0] ? mapRule(result.rows[0]) : null;
}

export async function saveSeoRedirectRule(rule: SeoRedirectRule) {
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
    [rule.id, rule.sourcePath, rule.targetPath, rule.statusCode, rule.enabled, JSON.stringify({ label: rule.label }), rule.createdAt]
  );
  return mapRule(result.rows[0]);
}

export async function deleteSeoRedirectRule(id: string) {
  await query("DELETE FROM seo_redirects WHERE id = $1", [id]);
}

export async function wouldCreateSeoRedirectCycle(sourcePath: string, targetPath: string) {
  if (!targetPath.startsWith("/")) {
    return false;
  }

  const source = normalizeSeoRedirectSource(sourcePath);
  let current = normalizeSeoRedirectSource(targetPath);
  const visited = new Set<string>();

  for (let depth = 0; depth < 32; depth += 1) {
    if (current === source || visited.has(current)) {
      return true;
    }
    visited.add(current);

    const rule = await getSeoRedirectRuleBySourcePath(current);
    if (!rule?.enabled || !rule.targetPath.startsWith("/")) {
      return false;
    }
    current = normalizeSeoRedirectSource(rule.targetPath);
  }

  return true;
}

export async function getActiveSeoRedirect(pathname: string) {
  const result = await query<SeoRedirectRow>(
    `
      SELECT id, source_path, target_path, status_code, is_active, metadata, created_at, updated_at
      FROM seo_redirects
      WHERE source_path = $1
        AND is_active = TRUE
      LIMIT 1
    `,
    [normalizeSeoRedirectSource(pathname)]
  );
  return result.rows[0] ? mapRule(result.rows[0]) : null;
}
