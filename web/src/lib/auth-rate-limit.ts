import { createHash } from "crypto";

import { query } from "@/lib/database";
import { getSystemSettings } from "@/lib/system-settings";
import type { AuthRateLimitRuleSettings } from "@/lib/system-settings";

export type RateLimitScope =
 | "login:ip"
 | "login:email"
 | "admin_login:ip"
 | "admin_login:email"
 | "provider_login:ip"
 | "provider_login:email"
 | "register:ip"
 | "register:email"
 | "register:phone";

type RateLimitRule = {
 limit: number;
 window: string;
};

export type TrustedProxyMode = "none" | "reverse_proxy" | "cloudflare";

export type TrustedProxyConfig = {
 mode: TrustedProxyMode;
 trustsCloudflareHeader: boolean;
 trustsForwardedHeaders: boolean;
 trustedHeaders: string[];
 warning: string | null;
};

const RATE_LIMIT_RULES: Record<RateLimitScope, RateLimitRule> = {
 "login:ip": { limit: 120, window: "15 minutes" },
 "login:email": { limit: 10, window: "15 minutes" },
 "admin_login:ip": { limit: 30, window: "15 minutes" },
 "admin_login:email": { limit: 5, window: "15 minutes" },
 "provider_login:ip": { limit: 60, window: "15 minutes" },
 "provider_login:email": { limit: 6, window: "15 minutes" },
 "register:ip": { limit: 40, window: "1 hour" },
 "register:email": { limit: 5, window: "1 hour" },
 "register:phone": { limit: 5, window: "1 hour" },
};

export class AuthRateLimitError extends Error {
 constructor() {
  super("AUTH_RATE_LIMITED");
 }
}

function hashRateKey(value: string) {
 return createHash("sha256").update(value).digest("hex");
}

export function hashAuthRateLimitKey(scope: RateLimitScope, rawKey: string) {
 return hashRateKey(`${scope}:${rawKey.trim().toLowerCase()}`);
}

function parseTrustedProxyMode(value: string | undefined): TrustedProxyMode {
 const normalized = value?.trim().toLowerCase();
 if (normalized === "reverse_proxy" || normalized === "cloudflare") {
  return normalized;
 }
 return "none";
}

export function getTrustedProxyConfig(): TrustedProxyConfig {
 const mode = parseTrustedProxyMode(process.env.AUTH_TRUSTED_PROXY_MODE);
 const trustsCloudflareHeader = mode === "cloudflare";
 const trustsForwardedHeaders = mode === "reverse_proxy";
 const trustedHeaders = [
  ...(trustsCloudflareHeader ? ["cf-connecting-ip"] : []),
  ...(trustsForwardedHeaders ? ["x-forwarded-for", "x-real-ip"] : []),
 ];

 return {
  mode,
  trustsCloudflareHeader,
  trustsForwardedHeaders,
  trustedHeaders,
  warning:
   mode === "none"
    ? "AUTH_TRUSTED_PROXY_MODE=none: app không tin IP forwarding headers. Rate-limit IP sẽ dùng unknown trừ khi tầng server/proxy truyền IP đáng tin."
    : null,
 };
}

function toInterval(rule: AuthRateLimitRuleSettings) {
 return `${rule.windowMinutes} minutes`;
}

async function getRateLimitRule(scope: RateLimitScope): Promise<RateLimitRule> {
 if (
  scope === "login:ip" ||
  scope === "login:email" ||
  scope === "admin_login:ip" ||
  scope === "admin_login:email" ||
  scope === "provider_login:ip" ||
  scope === "provider_login:email"
 ) {
  const settings = await getSystemSettings();
  const configured = {
   "login:ip": settings.security.authRateLimits.publicLoginIp,
   "login:email": settings.security.authRateLimits.publicLoginEmail,
   "admin_login:ip": settings.security.authRateLimits.adminLoginIp,
   "admin_login:email": settings.security.authRateLimits.adminLoginEmail,
   "provider_login:ip": settings.security.authRateLimits.providerLoginIp,
   "provider_login:email": settings.security.authRateLimits.providerLoginEmail,
  }[scope];

  return {
   limit: configured.limit,
   window: toInterval(configured),
  };
 }

 return RATE_LIMIT_RULES[scope];
}

export function getRequestIp(request: Request) {
 const proxyConfig = getTrustedProxyConfig();
 const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

 if (proxyConfig.trustsCloudflareHeader) {
  return request.headers.get("cf-connecting-ip")?.trim() || "unknown";
 }

 if (proxyConfig.trustsForwardedHeaders) {
  return forwardedFor || request.headers.get("x-real-ip")?.trim() || "unknown";
 }

 return "unknown";
}

export async function recordAuthRateLimit(scope: RateLimitScope, rawKey: string) {
 const rule = await getRateLimitRule(scope);
 const rateKey = hashAuthRateLimitKey(scope, rawKey);

 const result = await query<{ attempts: number }>(
  `
   INSERT INTO auth_rate_limits (scope, rate_key, window_start, attempts, expires_at)
   VALUES ($1, $2, NOW(), 1, NOW() + $3::interval)
   ON CONFLICT (scope, rate_key)
   DO UPDATE SET
    attempts = CASE
     WHEN auth_rate_limits.window_start < NOW() - $3::interval THEN 1
     ELSE auth_rate_limits.attempts + 1
    END,
    window_start = CASE
     WHEN auth_rate_limits.window_start < NOW() - $3::interval THEN NOW()
     ELSE auth_rate_limits.window_start
    END,
    expires_at = NOW() + $3::interval,
    updated_at = NOW()
   RETURNING attempts
  `,
  [scope, rateKey, rule.window]
 );

 if ((result.rows[0]?.attempts ?? 0) > rule.limit) {
  throw new AuthRateLimitError();
 }
}

export async function checkAuthRateLimit(scope: RateLimitScope, rawKey: string) {
 const rule = await getRateLimitRule(scope);
 const rateKey = hashAuthRateLimitKey(scope, rawKey);

 const result = await query<{ attempts: number }>(
  `
   SELECT attempts
   FROM auth_rate_limits
   WHERE scope = $1
    AND rate_key = $2
    AND window_start >= NOW() - $3::interval
    AND expires_at > NOW()
   LIMIT 1
  `,
  [scope, rateKey, rule.window]
 );

 if ((result.rows[0]?.attempts ?? 0) >= rule.limit) {
  throw new AuthRateLimitError();
 }
}

export async function resetAuthRateLimit(scope: RateLimitScope, rawKey: string) {
 const rateKey = hashAuthRateLimitKey(scope, rawKey);
 await query("DELETE FROM auth_rate_limits WHERE scope = $1 AND rate_key = $2", [scope, rateKey]);
}

export type AuthRateLimitAdminRow = {
 scope: string;
 rateKey: string;
 rateKeyShort: string;
 attempts: number;
 windowStart: string;
 expiresAt: string;
 updatedAt: string;
 status: "active" | "expired";
};

const ALL_RATE_LIMIT_SCOPES: RateLimitScope[] = [
 "login:ip",
 "login:email",
 "admin_login:ip",
 "admin_login:email",
 "provider_login:ip",
 "provider_login:email",
 "register:ip",
 "register:email",
 "register:phone",
];

function mapAdminRow(row: {
 scope: string;
 rate_key: string;
 attempts: number;
 window_start: string;
 expires_at: string;
 updated_at: string;
 status: "active" | "expired";
}): AuthRateLimitAdminRow {
 return {
  scope: row.scope,
  rateKey: row.rate_key,
  rateKeyShort: `${row.rate_key.slice(0, 12)}...${row.rate_key.slice(-8)}`,
  attempts: row.attempts,
  windowStart: row.window_start,
  expiresAt: row.expires_at,
  updatedAt: row.updated_at,
  status: row.status,
 };
}

export async function listAuthRateLimits(input: {
 scope?: string;
 status?: "active" | "expired" | "all";
 rawKey?: string;
 limit?: number;
} = {}) {
 const params: unknown[] = [];
 const where: string[] = [];
 const scope = input.scope?.trim();
 const status = input.status ?? "all";
 const rawKey = input.rawKey?.trim();

 if (scope && scope !== "all") {
  params.push(scope);
  where.push(`scope = $${params.length}`);
 }

 if (status === "active") {
  where.push("expires_at > NOW()");
 } else if (status === "expired") {
  where.push("expires_at <= NOW()");
 }

 if (rawKey) {
  const scopes = scope && scope !== "all" ? [scope as RateLimitScope] : ALL_RATE_LIMIT_SCOPES;
  const hashedKeys = scopes.map((item) => hashAuthRateLimitKey(item, rawKey));
  params.push(hashedKeys);
  where.push(`rate_key = ANY($${params.length}::text[])`);
 }

 params.push(Math.max(1, Math.min(500, Math.floor(input.limit ?? 100))));

 const result = await query<{
  scope: string;
  rate_key: string;
  attempts: number;
  window_start: string;
  expires_at: string;
  updated_at: string;
  status: "active" | "expired";
 }>(
  `
   SELECT
    scope,
    rate_key,
    attempts,
    window_start::text,
    expires_at::text,
    updated_at::text,
    CASE WHEN expires_at > NOW() THEN 'active' ELSE 'expired' END AS status
   FROM auth_rate_limits
   ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
   ORDER BY expires_at DESC, updated_at DESC
   LIMIT $${params.length}
  `,
  params
 );

 return result.rows.map(mapAdminRow);
}

export async function deleteAuthRateLimit(scope: string, rateKey: string) {
 const result = await query<{
  scope: string;
  rate_key: string;
  attempts: number;
  window_start: string;
  expires_at: string;
  updated_at: string;
  status: "active" | "expired";
 }>(
  `
   DELETE FROM auth_rate_limits
   WHERE scope = $1 AND rate_key = $2
   RETURNING
    scope,
    rate_key,
    attempts,
    window_start::text,
    expires_at::text,
    updated_at::text,
    CASE WHEN expires_at > NOW() THEN 'active' ELSE 'expired' END AS status
  `,
  [scope, rateKey]
 );

 return result.rows.map(mapAdminRow);
}

export async function deleteAuthRateLimitScope(scope: string) {
 const result = await query<{
  scope: string;
  rate_key: string;
  attempts: number;
  window_start: string;
  expires_at: string;
  updated_at: string;
  status: "active" | "expired";
 }>(
  `
   DELETE FROM auth_rate_limits
   WHERE scope = $1
   RETURNING
    scope,
    rate_key,
    attempts,
    window_start::text,
    expires_at::text,
    updated_at::text,
    CASE WHEN expires_at > NOW() THEN 'active' ELSE 'expired' END AS status
  `,
  [scope]
 );

 return result.rows.map(mapAdminRow);
}

export async function clearExpiredAuthRateLimits() {
 const result = await query<{
  scope: string;
  rate_key: string;
  attempts: number;
  window_start: string;
  expires_at: string;
  updated_at: string;
  status: "active" | "expired";
 }>(
  `
   DELETE FROM auth_rate_limits
   WHERE expires_at <= NOW()
   RETURNING
    scope,
    rate_key,
    attempts,
    window_start::text,
    expires_at::text,
    updated_at::text,
    'expired' AS status
  `
 );

 return result.rows.map(mapAdminRow);
}

export async function cleanupExpiredAuthRateLimits(retentionDays: number) {
 const safeRetentionDays = Math.max(1, Math.min(365, Math.floor(retentionDays)));
 const result = await query<{ deleted_count: string }>(
  `
   WITH deleted AS (
    DELETE FROM auth_rate_limits
    WHERE expires_at < NOW() - ($1::int * INTERVAL '1 day')
    RETURNING 1
   )
   SELECT COUNT(*)::text AS deleted_count
   FROM deleted
  `,
  [safeRetentionDays]
 );

 return Number(result.rows[0]?.deleted_count ?? "0");
}
