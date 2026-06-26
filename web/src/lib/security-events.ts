import "server-only";

import { query } from "@/lib/database";
import { getRequestIp } from "@/lib/auth-rate-limit";
import { getSystemSettings, type SecuritySettings } from "@/lib/system-settings";

export type SecurityEventType =
  | "login_failed"
  | "login_success"
  | "register_failed"
  | "register_success"
  | "rate_limited"
  | "csrf_failed"
  | "forbidden_api"
  | "suspicious_path"
  | "upload_rejected"
  | "endpoint_access"
  | "endpoint_high_frequency"
  | "endpoint_slow"
  | "ip_warn"
  | "ip_suspicious"
  | "ip_blocked"
  | "admin_action";

export type SecurityEventSeverity = "info" | "warn" | "critical";

export type SecurityEventFilters = {
  from?: string;
  to?: string;
  eventType?: string;
  ip?: string;
  userId?: string;
  path?: string;
  status?: string;
  suspiciousOnly?: boolean;
  limit?: number;
};

export type SecurityEventRow = {
  id: string;
  eventType: string;
  severity: SecurityEventSeverity;
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  status: number | null;
  referer: string;
  userId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type SecurityEventSummary = {
  totalEvents: number;
  loginFails: number;
  registerFails: number;
  rateLimitHits: number;
  csrfFails: number;
  firstSeen: string | null;
  lastSeen: string | null;
  topIps: Array<{ ip: string; count: number; firstSeen: string; lastSeen: string }>;
  topLoginFailIps: Array<{ ip: string; count: number }>;
  topBlockedPaths: Array<{ path: string; status: number; count: number }>;
  rateLimitHitsByHour: Array<{ hour: string; count: number }>;
};

const SUSPICIOUS_EVENT_TYPES = ["rate_limited", "csrf_failed", "forbidden_api", "suspicious_path", "upload_rejected", "endpoint_high_frequency", "endpoint_slow", "ip_warn", "ip_suspicious", "ip_blocked"];
const DETECTION_EVENT_TYPES = ["ip_warn", "ip_suspicious", "ip_blocked"];

function truncate(value: string | null, maxLength: number) {
  if (!value) return "";
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function normalizePath(request: Request) {
  try {
    return truncate(new URL(request.url).pathname, 500) || "/";
  } catch {
    return "/";
  }
}

function normalizeReferer(request: Request) {
  const referer = request.headers.get("referer");
  if (!referer) return "";

  try {
    const url = new URL(referer);
    return truncate(`${url.origin}${url.pathname}`, 500);
  } catch {
    return truncate(referer, 500);
  }
}

export async function recordSecurityEvent(input: {
  request: Request;
  eventType: SecurityEventType;
  severity?: SecurityEventSeverity;
  status?: number;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const metadata = input.metadata ?? {};
  const ip = truncate(getRequestIp(input.request), 128) || "unknown";
  const path = normalizePath(input.request);
  const method = truncate(input.request.method || "GET", 16);

  await query(
    `
     INSERT INTO security_events (
      event_type,
      severity,
      ip,
      user_agent,
      path,
      method,
      status,
      referer,
      user_id,
      metadata
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
    `,
    [
      input.eventType,
      input.severity ?? "info",
      ip,
      truncate(input.request.headers.get("user-agent"), 500),
      path,
      method,
      input.status ?? null,
      normalizeReferer(input.request),
      input.userId ?? null,
      JSON.stringify(metadata),
    ]
  );

  if (!DETECTION_EVENT_TYPES.includes(input.eventType)) {
    await detectSuspiciousIpActivity({
      ip,
      request: input.request,
      path,
      method,
    }).catch(() => undefined);
  }
}

type DetectionLevel = "none" | "warn" | "suspicious" | "blocked";

type DetectionMetric = {
  key: string;
  label: string;
  count: number;
  windowMinutes: number;
  warnLimit: number;
  suspiciousLimit: number;
  blockLimit: number;
};

function parseWhitelist(value: string) {
  return value
    .split(/[\n,]+/g)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function isWhitelistedIp(ip: string, whitelist: string) {
  if (ip === "unknown") return true;
  return parseWhitelist(whitelist).some((entry) => entry === ip);
}

function levelForMetric(metric: DetectionMetric): DetectionLevel {
  if (metric.count >= metric.blockLimit) return "blocked";
  if (metric.count >= metric.suspiciousLimit) return "suspicious";
  if (metric.count >= metric.warnLimit) return "warn";
  return "none";
}

function strongestLevel(current: DetectionLevel, next: DetectionLevel): DetectionLevel {
  const rank: Record<DetectionLevel, number> = {
    none: 0,
    warn: 1,
    suspicious: 2,
    blocked: 3,
  };
  return rank[next] > rank[current] ? next : current;
}

async function countIpEvents(input: {
  ip: string;
  windowMinutes: number;
  eventTypes?: string[];
  statuses?: number[];
  distinctPaths?: boolean;
}) {
  const where = [
    "ip = $1",
    "created_at >= NOW() - ($2::int * INTERVAL '1 minute')",
    "event_type <> ALL($3::text[])",
  ];
  const params: unknown[] = [input.ip, input.windowMinutes, DETECTION_EVENT_TYPES];

  if (input.eventTypes?.length) {
    params.push(input.eventTypes);
    where.push(`event_type = ANY($${params.length}::text[])`);
  }

  if (input.statuses?.length) {
    params.push(input.statuses);
    where.push(`status = ANY($${params.length}::int[])`);
  }

  const result = await query<{ count: string }>(
    `
     SELECT ${input.distinctPaths ? "COUNT(DISTINCT path)" : "COUNT(*)"}::text AS count
     FROM security_events
     WHERE ${where.join(" AND ")}
    `,
    params
  );

  return Number(result.rows[0]?.count ?? "0");
}

async function recentlyLoggedDetection(ip: string, level: DetectionLevel) {
  const eventType = level === "blocked" ? "ip_blocked" : level === "suspicious" ? "ip_suspicious" : "ip_warn";
  const result = await query<{ id: string }>(
    `
     SELECT id
     FROM security_events
     WHERE ip = $1
       AND event_type = $2
       AND created_at >= NOW() - INTERVAL '5 minutes'
     LIMIT 1
    `,
    [ip, eventType]
  );

  return Boolean(result.rows[0]);
}

async function insertDetectionEvent(input: {
  request: Request;
  ip: string;
  path: string;
  method: string;
  level: Exclude<DetectionLevel, "none">;
  metrics: DetectionMetric[];
  settings: SecuritySettings["detection"];
}) {
  if (await recentlyLoggedDetection(input.ip, input.level)) {
    return;
  }

  const eventType = input.level === "blocked" ? "ip_blocked" : input.level === "suspicious" ? "ip_suspicious" : "ip_warn";
  const severity: SecurityEventSeverity = input.level === "blocked" ? "critical" : "warn";
  const triggered = input.metrics.filter((metric) => levelForMetric(metric) !== "none");
  const metadata = {
    level: input.level,
    dryRun: input.settings.dryRun,
    autoBlock: input.settings.autoBlock,
    blockDurationMinutes: input.settings.blockDurationMinutes,
    effectiveAction:
      input.level === "blocked" && input.settings.autoBlock && !input.settings.dryRun
        ? "block_candidate_requires_task_10_enforcement"
        : "log_only",
    triggered,
  };

  await query(
    `
     INSERT INTO security_events (
      event_type,
      severity,
      ip,
      user_agent,
      path,
      method,
      status,
      referer,
      metadata
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
    `,
    [
      eventType,
      severity,
      input.ip,
      truncate(input.request.headers.get("user-agent"), 500),
      input.path,
      input.method,
      input.level === "blocked" ? 429 : null,
      normalizeReferer(input.request),
      JSON.stringify(metadata),
    ]
  );
}

async function detectSuspiciousIpActivity(input: {
  ip: string;
  request: Request;
  path: string;
  method: string;
}) {
  const settings = (await getSystemSettings()).security.detection;

  if (!settings.enabled || isWhitelistedIp(input.ip, settings.whitelistIps)) {
    return;
  }

  const [
    requestCount,
    statusCount,
    loginFailCount,
    registerFailCount,
    scanPathCount,
  ] = await Promise.all([
    countIpEvents({ ip: input.ip, windowMinutes: settings.requestWindowMinutes }),
    countIpEvents({ ip: input.ip, windowMinutes: settings.statusWindowMinutes, statuses: [403, 404] }),
    countIpEvents({ ip: input.ip, windowMinutes: settings.loginFailWindowMinutes, eventTypes: ["login_failed"] }),
    countIpEvents({ ip: input.ip, windowMinutes: settings.registerFailWindowMinutes, eventTypes: ["register_failed"] }),
    countIpEvents({
      ip: input.ip,
      windowMinutes: settings.scanPathWindowMinutes,
      eventTypes: ["suspicious_path", "forbidden_api"],
      distinctPaths: true,
    }),
  ]);

  const metrics: DetectionMetric[] = [
    {
      key: "request_rate",
      label: "Security events per minute",
      count: requestCount,
      windowMinutes: settings.requestWindowMinutes,
      warnLimit: settings.requestWarnLimit,
      suspiciousLimit: settings.requestSuspiciousLimit,
      blockLimit: settings.requestBlockLimit,
    },
    {
      key: "status_403_404_rate",
      label: "403/404 per minute",
      count: statusCount,
      windowMinutes: settings.statusWindowMinutes,
      warnLimit: settings.statusWarnLimit,
      suspiciousLimit: settings.statusSuspiciousLimit,
      blockLimit: settings.statusBlockLimit,
    },
    {
      key: "login_fail_rate",
      label: "Login fail per window",
      count: loginFailCount,
      windowMinutes: settings.loginFailWindowMinutes,
      warnLimit: settings.loginFailWarnLimit,
      suspiciousLimit: settings.loginFailSuspiciousLimit,
      blockLimit: settings.loginFailBlockLimit,
    },
    {
      key: "register_fail_rate",
      label: "Register fail per window",
      count: registerFailCount,
      windowMinutes: settings.registerFailWindowMinutes,
      warnLimit: settings.registerFailWarnLimit,
      suspiciousLimit: settings.registerFailSuspiciousLimit,
      blockLimit: settings.registerFailBlockLimit,
    },
    {
      key: "scan_path_rate",
      label: "Distinct suspicious paths per window",
      count: scanPathCount,
      windowMinutes: settings.scanPathWindowMinutes,
      warnLimit: settings.scanPathWarnLimit,
      suspiciousLimit: settings.scanPathSuspiciousLimit,
      blockLimit: settings.scanPathBlockLimit,
    },
  ];

  const level = metrics.reduce<DetectionLevel>((current, metric) => strongestLevel(current, levelForMetric(metric)), "none");
  if (level === "none") {
    return;
  }

  await insertDetectionEvent({
    request: input.request,
    ip: input.ip,
    path: input.path,
    method: input.method,
    level,
    metrics,
    settings,
  });
}

function parseLimit(value: number | undefined, fallback: number) {
  return Math.max(1, Math.min(1000, Math.floor(value ?? fallback)));
}

function buildSecurityEventWhere(filters: SecurityEventFilters) {
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

  if (filters.eventType && filters.eventType !== "all") {
    params.push(filters.eventType);
    where.push(`event_type = $${params.length}`);
  }

  if (filters.ip) {
    params.push(filters.ip.trim());
    where.push(`ip = $${params.length}`);
  }

  if (filters.userId) {
    params.push(filters.userId.trim());
    where.push(`user_id = $${params.length}`);
  }

  if (filters.path) {
    params.push(`%${filters.path.trim()}%`);
    where.push(`path ILIKE $${params.length}`);
  }

  if (filters.status) {
    const status = Number(filters.status);
    if (Number.isInteger(status)) {
      params.push(status);
      where.push(`status = $${params.length}`);
    }
  }

  if (filters.suspiciousOnly) {
    params.push(SUSPICIOUS_EVENT_TYPES);
    where.push(`(event_type = ANY($${params.length}::text[]) OR status IN (403, 404, 429))`);
  }

  return {
    params,
    whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "",
  };
}

function mapSecurityEventRow(row: {
  id: string;
  event_type: string;
  severity: SecurityEventSeverity;
  ip: string;
  user_agent: string | null;
  path: string;
  method: string;
  status: number | null;
  referer: string | null;
  user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}): SecurityEventRow {
  return {
    id: row.id,
    eventType: row.event_type,
    severity: row.severity,
    ip: row.ip,
    userAgent: row.user_agent ?? "",
    path: row.path,
    method: row.method,
    status: row.status,
    referer: row.referer ?? "",
    userId: row.user_id,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

export async function listSecurityEvents(filters: SecurityEventFilters = {}) {
  const { params, whereSql } = buildSecurityEventWhere(filters);
  params.push(parseLimit(filters.limit, 200));

  const result = await query<{
    id: string;
    event_type: string;
    severity: SecurityEventSeverity;
    ip: string;
    user_agent: string | null;
    path: string;
    method: string;
    status: number | null;
    referer: string | null;
    user_id: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
  }>(
    `
     SELECT
      id,
      event_type,
      severity,
      ip,
      user_agent,
      path,
      method,
      status,
      referer,
      user_id,
      metadata,
      created_at::text
     FROM security_events
     ${whereSql}
     ORDER BY created_at DESC
     LIMIT $${params.length}
    `,
    params
  );

  return result.rows.map(mapSecurityEventRow);
}

export async function getSecurityEventSummary(filters: SecurityEventFilters = {}): Promise<SecurityEventSummary> {
  const { params, whereSql } = buildSecurityEventWhere(filters);
  const commonValues = [...params];

  const totals = await query<{
    total_events: string;
    login_fails: string;
    register_fails: string;
    rate_limit_hits: string;
    csrf_fails: string;
    first_seen: string | null;
    last_seen: string | null;
  }>(
    `
     SELECT
      COUNT(*)::text AS total_events,
      COUNT(*) FILTER (WHERE event_type = 'login_failed')::text AS login_fails,
      COUNT(*) FILTER (WHERE event_type = 'register_failed')::text AS register_fails,
      COUNT(*) FILTER (WHERE event_type = 'rate_limited')::text AS rate_limit_hits,
      COUNT(*) FILTER (WHERE event_type = 'csrf_failed')::text AS csrf_fails,
      MIN(created_at)::text AS first_seen,
      MAX(created_at)::text AS last_seen
     FROM security_events
     ${whereSql}
    `,
    commonValues
  );

  const topIps = await query<{ ip: string; count: string; first_seen: string; last_seen: string }>(
    `
     SELECT ip, COUNT(*)::text AS count, MIN(created_at)::text AS first_seen, MAX(created_at)::text AS last_seen
     FROM security_events
     ${whereSql}
     GROUP BY ip
     ORDER BY COUNT(*) DESC, MAX(created_at) DESC
     LIMIT 10
    `,
    commonValues
  );

  const topLoginFailIps = await query<{ ip: string; count: string }>(
    `
     SELECT ip, COUNT(*)::text AS count
     FROM security_events
     ${whereSql ? `${whereSql} AND` : "WHERE"} event_type = 'login_failed'
     GROUP BY ip
     ORDER BY COUNT(*) DESC, MAX(created_at) DESC
     LIMIT 10
    `,
    commonValues
  );

  const topBlockedPaths = await query<{ path: string; status: number; count: string }>(
    `
     SELECT path, status, COUNT(*)::text AS count
     FROM security_events
     ${whereSql ? `${whereSql} AND` : "WHERE"} status IN (403, 404)
     GROUP BY path, status
     ORDER BY COUNT(*) DESC, MAX(created_at) DESC
     LIMIT 10
    `,
    commonValues
  );

  const rateLimitHitsByHour = await query<{ hour: string; count: string }>(
    `
     SELECT date_trunc('hour', created_at)::text AS hour, COUNT(*)::text AS count
     FROM security_events
     ${whereSql ? `${whereSql} AND` : "WHERE"} event_type = 'rate_limited'
     GROUP BY date_trunc('hour', created_at)
     ORDER BY date_trunc('hour', created_at) DESC
     LIMIT 24
    `,
    commonValues
  );

  const totalRow = totals.rows[0];

  return {
    totalEvents: Number(totalRow?.total_events ?? "0"),
    loginFails: Number(totalRow?.login_fails ?? "0"),
    registerFails: Number(totalRow?.register_fails ?? "0"),
    rateLimitHits: Number(totalRow?.rate_limit_hits ?? "0"),
    csrfFails: Number(totalRow?.csrf_fails ?? "0"),
    firstSeen: totalRow?.first_seen ?? null,
    lastSeen: totalRow?.last_seen ?? null,
    topIps: topIps.rows.map((row) => ({
      ip: row.ip,
      count: Number(row.count),
      firstSeen: row.first_seen,
      lastSeen: row.last_seen,
    })),
    topLoginFailIps: topLoginFailIps.rows.map((row) => ({ ip: row.ip, count: Number(row.count) })),
    topBlockedPaths: topBlockedPaths.rows.map((row) => ({ path: row.path, status: row.status, count: Number(row.count) })),
    rateLimitHitsByHour: rateLimitHitsByHour.rows.map((row) => ({ hour: row.hour, count: Number(row.count) })),
  };
}

export const SECURITY_EVENT_TYPE_OPTIONS: Array<SecurityEventType | "all"> = [
  "all",
  "login_failed",
  "login_success",
  "register_failed",
  "register_success",
  "rate_limited",
  "csrf_failed",
  "forbidden_api",
  "suspicious_path",
  "upload_rejected",
  "endpoint_access",
  "endpoint_high_frequency",
  "endpoint_slow",
  "ip_warn",
  "ip_suspicious",
  "ip_blocked",
  "admin_action",
];
