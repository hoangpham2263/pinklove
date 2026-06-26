import "server-only";

import { getRequestIp } from "@/lib/auth-rate-limit";
import { query } from "@/lib/database";

export type SecurityAuditLogRow = {
  id: string;
  adminUserId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  beforeValue: unknown;
  afterValue: unknown;
  reason: string;
  ip: string;
  userAgent: string;
  createdAt: string;
};

export type SecurityAuditLogFilters = {
  from?: string;
  to?: string;
  adminUserId?: string;
  action?: string;
  target?: string;
  limit?: number;
};

function truncate(value: string | null, maxLength: number) {
  if (!value) return "";
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

export async function recordSecurityAuditLog(input: {
  request: Request;
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
}) {
  await query(
    `
     INSERT INTO security_audit_logs (
      admin_user_id,
      action,
      target_type,
      target_id,
      before_value,
      after_value,
      reason,
      ip,
      user_agent
     )
     VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9)
    `,
    [
      input.adminUserId,
      input.action,
      input.targetType,
      input.targetId,
      JSON.stringify(input.before ?? null),
      JSON.stringify(input.after ?? null),
      truncate(input.reason ?? "", 1000),
      truncate(getRequestIp(input.request), 128) || "unknown",
      truncate(input.request.headers.get("user-agent"), 500),
    ]
  );
}

function buildWhere(filters: SecurityAuditLogFilters) {
  const params: unknown[] = [];
  const where: string[] = [];

  if (filters.from) {
    params.push(filters.from);
    where.push(`created_at >= $${params.length}::timestamptz`);
  }

  if (filters.to) {
    params.push(filters.to);
    where.push(`created_at <= $${params.length}::timestamptz`);
  }

  if (filters.adminUserId) {
    params.push(filters.adminUserId.trim());
    where.push(`admin_user_id = $${params.length}`);
  }

  if (filters.action && filters.action !== "all") {
    params.push(filters.action.trim());
    where.push(`action = $${params.length}`);
  }

  if (filters.target) {
    params.push(`%${filters.target.trim()}%`);
    where.push(`(target_type ILIKE $${params.length} OR target_id ILIKE $${params.length})`);
  }

  return {
    params,
    whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "",
  };
}

function parseLimit(value: number | undefined, fallback: number) {
  return Math.max(1, Math.min(1000, Math.floor(value ?? fallback)));
}

function mapRow(row: {
  id: string;
  admin_user_id: string | null;
  action: string;
  target_type: string;
  target_id: string;
  before_value: unknown;
  after_value: unknown;
  reason: string;
  ip: string;
  user_agent: string | null;
  created_at: string;
}): SecurityAuditLogRow {
  return {
    id: row.id,
    adminUserId: row.admin_user_id,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    beforeValue: row.before_value,
    afterValue: row.after_value,
    reason: row.reason,
    ip: row.ip,
    userAgent: row.user_agent ?? "",
    createdAt: row.created_at,
  };
}

export async function listSecurityAuditLogs(filters: SecurityAuditLogFilters = {}) {
  const { params, whereSql } = buildWhere(filters);
  params.push(parseLimit(filters.limit, 250));

  const result = await query<{
    id: string;
    admin_user_id: string | null;
    action: string;
    target_type: string;
    target_id: string;
    before_value: unknown;
    after_value: unknown;
    reason: string;
    ip: string;
    user_agent: string | null;
    created_at: string;
  }>(
    `
     SELECT
      id,
      admin_user_id,
      action,
      target_type,
      target_id,
      before_value,
      after_value,
      reason,
      ip,
      user_agent,
      created_at::text
     FROM security_audit_logs
     ${whereSql}
     ORDER BY created_at DESC
     LIMIT $${params.length}
    `,
    params
  );

  return result.rows.map(mapRow);
}

export async function listSecurityAuditActions() {
  const result = await query<{ action: string }>(
    `
     SELECT DISTINCT action
     FROM security_audit_logs
     ORDER BY action
    `
  );
  return result.rows.map((row) => row.action);
}
