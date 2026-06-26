import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { hasAdminPermission } from "@/features/access/server/service";
import { listSecurityEvents, type SecurityEventFilters } from "@/lib/security-events";

export const runtime = "nodejs";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function filtersFromUrl(url: string): SecurityEventFilters {
  const params = new URL(url).searchParams;
  return {
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
    eventType: params.get("eventType") ?? "all",
    ip: params.get("ip") ?? "",
    userId: params.get("userId") ?? "",
    path: params.get("path") ?? "",
    status: params.get("status") ?? "",
    suspiciousOnly: params.get("suspiciousOnly") === "1",
    limit: 1000,
  };
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!(await hasAdminPermission(admin.id, "security.logs.export"))) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const rows = await listSecurityEvents(filtersFromUrl(request.url));
  const headers = [
    "created_at",
    "event_type",
    "severity",
    "ip",
    "method",
    "path",
    "status",
    "user_id",
    "referer",
    "user_agent",
    "metadata",
  ];
  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => [
      row.createdAt,
      row.eventType,
      row.severity,
      row.ip,
      row.method,
      row.path,
      row.status ?? "",
      row.userId ?? "",
      row.referer,
      row.userAgent,
      JSON.stringify(row.metadata),
    ].map(csvCell).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="security-events-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
