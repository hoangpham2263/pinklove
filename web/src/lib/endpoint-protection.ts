import "server-only";

import { NextResponse } from "next/server";

import { getRequestIp } from "@/lib/auth-rate-limit";
import { query } from "@/lib/database";
import { recordSecurityEvent } from "@/lib/security-events";
import { getSystemSettings, type SecuritySettings } from "@/lib/system-settings";

export type EndpointProtectionSettings = SecuritySettings["endpointProtection"];

export type EndpointProtectionDecision = {
  allowed: boolean;
  dryRun: boolean;
  bypassed: boolean;
  count: number;
  limit: number;
  status?: number;
  message?: string;
};

export function getEndpointTimerMs() {
  return Date.now();
}

function parseList(value: string) {
  return value
    .split(/[\n,]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizePath(request: Request) {
  try {
    return new URL(request.url).pathname || "/";
  } catch {
    return "/";
  }
}

function isBypassed(settings: EndpointProtectionSettings, request: Request, userId?: string | null) {
  const ip = getRequestIp(request);
  if (parseList(settings.whitelistIps).includes(ip)) return true;
  if (userId && parseList(settings.bypassUserIds).includes(userId)) return true;
  return false;
}

export async function getEndpointProtectionSettings() {
  return (await getSystemSettings()).security.endpointProtection;
}

export async function getEndpointPageSizeLimit() {
  const settings = await getEndpointProtectionSettings();
  return settings.enabled ? settings.maxPageSize : 500;
}

export async function getEndpointCacheTtlSeconds(kind: "search" | "publicData") {
  const settings = await getEndpointProtectionSettings();
  if (!settings.enabled) return 0;
  return kind === "search" ? settings.searchCacheTtlSeconds : settings.publicDataCacheTtlSeconds;
}

export async function getEndpointSearchResultLimit() {
  const settings = await getEndpointProtectionSettings();
  return settings.enabled ? settings.maxSearchResultsPerGroup : 200;
}

async function countRecentEndpointAccess(input: {
  request: Request;
  endpointKey: string;
  windowMinutes: number;
}) {
  const ip = getRequestIp(input.request);
  const path = normalizePath(input.request);
  const result = await query<{ count: string }>(
    `
     SELECT COUNT(*)::text AS count
     FROM security_events
     WHERE event_type = 'endpoint_access'
       AND ip = $1
       AND path = $2
       AND metadata->>'endpointKey' = $3
       AND created_at >= NOW() - ($4::int * INTERVAL '1 minute')
    `,
    [ip, path, input.endpointKey, input.windowMinutes]
  );

  return Number(result.rows[0]?.count ?? "0");
}

export async function enforceEndpointProtection(input: {
  request: Request;
  endpointKey: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<EndpointProtectionDecision> {
  const settings = await getEndpointProtectionSettings();
  if (!settings.enabled || !settings.rateLimitEnabled) {
    return { allowed: true, dryRun: false, bypassed: false, count: 0, limit: settings.blockLimit };
  }

  const bypassed = isBypassed(settings, input.request, input.userId);
  if (bypassed) {
    return { allowed: true, dryRun: settings.dryRun, bypassed: true, count: 0, limit: settings.blockLimit };
  }

  await recordSecurityEvent({
    request: input.request,
    eventType: "endpoint_access",
    severity: "info",
    userId: input.userId,
    metadata: {
      endpointKey: input.endpointKey,
      ...input.metadata,
    },
  }).catch(() => undefined);

  const count = await countRecentEndpointAccess({
    request: input.request,
    endpointKey: input.endpointKey,
    windowMinutes: settings.windowMinutes,
  });
  const overBlockLimit = count > settings.blockLimit;
  const overWarnLimit = count > settings.warnLimit;

  if (overBlockLimit || overWarnLimit) {
    await recordSecurityEvent({
      request: input.request,
      eventType: overBlockLimit ? "rate_limited" : "endpoint_high_frequency",
      severity: overBlockLimit ? "critical" : "warn",
      status: overBlockLimit && !settings.dryRun ? 429 : 200,
      userId: input.userId,
      metadata: {
        endpointKey: input.endpointKey,
        count,
        warnLimit: settings.warnLimit,
        blockLimit: settings.blockLimit,
        dryRun: settings.dryRun,
        reason: overBlockLimit ? "endpoint_rate_limit" : "endpoint_high_frequency",
      },
    }).catch(() => undefined);
  }

  if (overBlockLimit && !settings.dryRun) {
    return {
      allowed: false,
      dryRun: false,
      bypassed: false,
      count,
      limit: settings.blockLimit,
      status: 429,
      message: "Endpoint is temporarily rate limited. Please try again later.",
    };
  }

  return { allowed: true, dryRun: settings.dryRun, bypassed: false, count, limit: settings.blockLimit };
}

export function endpointProtectionResponse(decision: EndpointProtectionDecision) {
  return NextResponse.json(
    { message: decision.message ?? "Endpoint is temporarily rate limited." },
    {
      status: decision.status ?? 429,
      headers: {
        "Retry-After": "60",
      },
    }
  );
}

export async function recordSlowEndpoint(input: {
  request: Request;
  endpointKey: string;
  durationMs: number;
  status?: number;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const settings = await getEndpointProtectionSettings();
  if (!settings.enabled || input.durationMs < settings.slowThresholdMs) return;

  await recordSecurityEvent({
    request: input.request,
    eventType: "endpoint_slow",
    severity: "warn",
    status: input.status,
    userId: input.userId,
    metadata: {
      endpointKey: input.endpointKey,
      durationMs: input.durationMs,
      thresholdMs: settings.slowThresholdMs,
      ...input.metadata,
    },
  }).catch(() => undefined);
}
