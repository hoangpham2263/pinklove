import { NextResponse } from "next/server";

import { INTERNAL_API_KEY_HEADER } from "@/lib/api";
import { query } from "@/lib/database";
import { findActiveBlockedIpForIp } from "@/lib/blocked-ips";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const expectedSecret = process.env.INTERNAL_API_SECRET?.trim();
  return Boolean(expectedSecret && request.headers.get(INTERNAL_API_KEY_HEADER) === expectedSecret);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ blocked: false }, { status: 403 });
  }

  const url = new URL(request.url);
  const ip = url.searchParams.get("ip")?.trim();
  if (!ip || ip === "unknown") {
    return NextResponse.json({ blocked: false });
  }

  const manualBlock = await findActiveBlockedIpForIp(ip);
  if (manualBlock) {
    return NextResponse.json({
      blocked: true,
      source: "blocked_ips",
      blockId: manualBlock.id,
      ipOrCidr: manualBlock.ipOrCidr,
      reason: manualBlock.reason,
      expiresAt: manualBlock.expiresAt,
    });
  }

  const result = await query<{
    id: string;
    created_at: string;
    block_duration_minutes: number;
  }>(
    `
     SELECT
      id,
      created_at::text,
      COALESCE((metadata->>'blockDurationMinutes')::int, 15) AS block_duration_minutes
     FROM security_events
     WHERE ip = $1
       AND event_type = 'ip_blocked'
       AND COALESCE((metadata->>'dryRun')::boolean, true) = false
       AND COALESCE((metadata->>'autoBlock')::boolean, false) = true
       AND created_at + (COALESCE((metadata->>'blockDurationMinutes')::int, 15) * INTERVAL '1 minute') > NOW()
     ORDER BY created_at DESC
     LIMIT 1
    `,
    [ip]
  );
  const row = result.rows[0];

  if (!row) {
    return NextResponse.json({ blocked: false });
  }

  return NextResponse.json({
    blocked: true,
    source: "security_detection",
    eventId: row.id,
    blockedAt: row.created_at,
    durationMinutes: row.block_duration_minutes,
  });
}
