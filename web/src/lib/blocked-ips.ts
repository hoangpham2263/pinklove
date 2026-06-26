import "server-only";

import { query } from "@/lib/database";

export type BlockedIpStatus = "active" | "expired" | "revoked";

export type BlockedIpRow = {
  id: string;
  ipOrCidr: string;
  reason: string;
  expiresAt: string | null;
  createdBy: string | null;
  createdAt: string;
  revokedBy: string | null;
  revokedAt: string | null;
  updatedAt: string;
  status: BlockedIpStatus;
};

export type BlockedIpMatch = {
  id: string;
  ipOrCidr: string;
  reason: string;
  expiresAt: string | null;
  createdAt: string;
};

function normalizeIpOrCidr(value: string) {
  return value.trim().toLowerCase();
}

function parseIpv4(value: string) {
  const parts = value.trim().split(".");
  if (parts.length !== 4) return null;

  let result = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null;
    const number = Number(part);
    if (!Number.isInteger(number) || number < 0 || number > 255) return null;
    result = (result << 8) + number;
  }

  return result >>> 0;
}

export function isValidIpOrCidr(value: string) {
  const normalized = normalizeIpOrCidr(value);
  if (parseIpv4(normalized) !== null) return true;

  const [ip, prefix] = normalized.split("/");
  const parsedIp = parseIpv4(ip ?? "");
  const parsedPrefix = Number(prefix);
  return parsedIp !== null && Number.isInteger(parsedPrefix) && parsedPrefix >= 0 && parsedPrefix <= 32;
}

export function ipMatchesIpOrCidr(ip: string, ipOrCidr: string) {
  const normalizedIp = normalizeIpOrCidr(ip);
  const normalizedRule = normalizeIpOrCidr(ipOrCidr);

  if (normalizedIp === normalizedRule) return true;

  const [network, prefixText] = normalizedRule.split("/");
  if (!prefixText) return false;

  const ipNumber = parseIpv4(normalizedIp);
  const networkNumber = parseIpv4(network ?? "");
  const prefix = Number(prefixText);
  if (ipNumber === null || networkNumber === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return false;
  }

  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipNumber & mask) === (networkNumber & mask);
}

function mapBlockedIpRow(row: {
  id: string;
  ip_or_cidr: string;
  reason: string;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  revoked_by: string | null;
  revoked_at: string | null;
  updated_at: string;
  status: BlockedIpStatus;
}): BlockedIpRow {
  return {
    id: row.id,
    ipOrCidr: row.ip_or_cidr,
    reason: row.reason,
    expiresAt: row.expires_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    revokedBy: row.revoked_by,
    revokedAt: row.revoked_at,
    updatedAt: row.updated_at,
    status: row.status,
  };
}

function buildExpiresAt(durationMinutes: number | null) {
  if (!durationMinutes) return null;
  return new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
}

export async function listBlockedIps(input: {
  status?: string;
  queryText?: string;
  limit?: number;
} = {}) {
  const params: unknown[] = [];
  const where: string[] = [];
  const status = input.status ?? "all";
  const queryText = input.queryText?.trim();

  if (status === "active") {
    where.push("revoked_at IS NULL AND (expires_at IS NULL OR expires_at > NOW())");
  } else if (status === "expired") {
    where.push("revoked_at IS NULL AND expires_at IS NOT NULL AND expires_at <= NOW()");
  } else if (status === "revoked") {
    where.push("revoked_at IS NOT NULL");
  }

  if (queryText) {
    params.push(`%${queryText}%`);
    where.push(`(ip_or_cidr ILIKE $${params.length} OR reason ILIKE $${params.length})`);
  }

  params.push(Math.max(1, Math.min(500, Math.floor(input.limit ?? 200))));

  const result = await query<{
    id: string;
    ip_or_cidr: string;
    reason: string;
    expires_at: string | null;
    created_by: string | null;
    created_at: string;
    revoked_by: string | null;
    revoked_at: string | null;
    updated_at: string;
    status: BlockedIpStatus;
  }>(
    `
     SELECT
      id,
      ip_or_cidr,
      reason,
      expires_at::text,
      created_by,
      created_at::text,
      revoked_by,
      revoked_at::text,
      updated_at::text,
      CASE
        WHEN revoked_at IS NOT NULL THEN 'revoked'
        WHEN expires_at IS NOT NULL AND expires_at <= NOW() THEN 'expired'
        ELSE 'active'
      END AS status
     FROM blocked_ips
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY created_at DESC
     LIMIT $${params.length}
    `,
    params
  );

  return result.rows.map(mapBlockedIpRow);
}

export async function createBlockedIp(input: {
  ipOrCidr: string;
  reason: string;
  durationMinutes: number | null;
  createdBy: string;
}) {
  const ipOrCidr = normalizeIpOrCidr(input.ipOrCidr);
  if (!isValidIpOrCidr(ipOrCidr)) {
    throw new Error("INVALID_IP_OR_CIDR");
  }

  const result = await query<{
    id: string;
    ip_or_cidr: string;
    reason: string;
    expires_at: string | null;
    created_by: string | null;
    created_at: string;
    revoked_by: string | null;
    revoked_at: string | null;
    updated_at: string;
    status: BlockedIpStatus;
  }>(
    `
     INSERT INTO blocked_ips (ip_or_cidr, reason, expires_at, created_by)
     VALUES ($1, $2, $3::timestamptz, $4)
     RETURNING
      id,
      ip_or_cidr,
      reason,
      expires_at::text,
      created_by,
      created_at::text,
      revoked_by,
      revoked_at::text,
      updated_at::text,
      'active' AS status
    `,
    [ipOrCidr, input.reason.trim(), buildExpiresAt(input.durationMinutes), input.createdBy]
  );

  return mapBlockedIpRow(result.rows[0]);
}

export async function revokeBlockedIp(input: {
  id: string;
  revokedBy: string;
}) {
  const result = await query<{
    id: string;
    ip_or_cidr: string;
    reason: string;
    expires_at: string | null;
    created_by: string | null;
    created_at: string;
    revoked_by: string | null;
    revoked_at: string | null;
    updated_at: string;
    status: BlockedIpStatus;
  }>(
    `
     UPDATE blocked_ips
     SET revoked_by = $2,
         revoked_at = NOW(),
         updated_at = NOW()
     WHERE id = $1
       AND revoked_at IS NULL
     RETURNING
      id,
      ip_or_cidr,
      reason,
      expires_at::text,
      created_by,
      created_at::text,
      revoked_by,
      revoked_at::text,
      updated_at::text,
      'revoked' AS status
    `,
    [input.id, input.revokedBy]
  );

  return result.rows[0] ? mapBlockedIpRow(result.rows[0]) : null;
}

export async function extendBlockedIp(input: {
  id: string;
  durationMinutes: number;
}) {
  const result = await query<{
    id: string;
    ip_or_cidr: string;
    reason: string;
    expires_at: string | null;
    created_by: string | null;
    created_at: string;
    revoked_by: string | null;
    revoked_at: string | null;
    updated_at: string;
    status: BlockedIpStatus;
  }>(
    `
     UPDATE blocked_ips
     SET expires_at = NOW() + ($2::int * INTERVAL '1 minute'),
         updated_at = NOW()
     WHERE id = $1
       AND revoked_at IS NULL
     RETURNING
      id,
      ip_or_cidr,
      reason,
      expires_at::text,
      created_by,
      created_at::text,
      revoked_by,
      revoked_at::text,
      updated_at::text,
      CASE
        WHEN expires_at IS NOT NULL AND expires_at <= NOW() THEN 'expired'
        ELSE 'active'
      END AS status
    `,
    [input.id, Math.max(5, Math.min(30 * 24 * 60, Math.floor(input.durationMinutes)))]
  );

  return result.rows[0] ? mapBlockedIpRow(result.rows[0]) : null;
}

export async function findActiveBlockedIpForIp(ip: string): Promise<BlockedIpMatch | null> {
  const activeRows = await query<{
    id: string;
    ip_or_cidr: string;
    reason: string;
    expires_at: string | null;
    created_at: string;
  }>(
    `
     SELECT id, ip_or_cidr, reason, expires_at::text, created_at::text
     FROM blocked_ips
     WHERE revoked_at IS NULL
       AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY created_at DESC
     LIMIT 1000
    `
  );

  const match = activeRows.rows.find((row) => ipMatchesIpOrCidr(ip, row.ip_or_cidr));
  if (!match) return null;

  return {
    id: match.id,
    ipOrCidr: match.ip_or_cidr,
    reason: match.reason,
    expiresAt: match.expires_at,
    createdAt: match.created_at,
  };
}
