import { createHash } from "crypto";

import { query } from "@/lib/database";

type RateLimitScope =
 | "login:ip"
 | "login:email"
 | "register:ip"
 | "register:email"
 | "register:phone";

type RateLimitRule = {
 limit: number;
 window: string;
};

const RATE_LIMIT_RULES: Record<RateLimitScope, RateLimitRule> = {
 "login:ip": { limit: 120, window: "15 minutes" },
 "login:email": { limit: 10, window: "15 minutes" },
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

export function getRequestIp(request: Request) {
 const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
 return (
  request.headers.get("cf-connecting-ip")?.trim() ||
  request.headers.get("x-real-ip")?.trim() ||
  forwardedFor ||
  "unknown"
 );
}

export async function recordAuthRateLimit(scope: RateLimitScope, rawKey: string) {
 const rule = RATE_LIMIT_RULES[scope];
 const rateKey = hashRateKey(`${scope}:${rawKey.trim().toLowerCase()}`);

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

export async function resetAuthRateLimit(scope: RateLimitScope, rawKey: string) {
 const rateKey = hashRateKey(`${scope}:${rawKey.trim().toLowerCase()}`);
 await query("DELETE FROM auth_rate_limits WHERE scope = $1 AND rate_key = $2", [scope, rateKey]);
}
