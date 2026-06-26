import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { hasAdminPermission } from "@/features/access/server/service";
import { listSecurityAuditLogs, type SecurityAuditLogFilters } from "@/lib/security-audit-logs";

export const runtime = "nodejs";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function filtersFromUrl(url: string): SecurityAuditLogFilters {
  const params = new URL(url).searchParams;
  return {
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
    adminUserId: params.get("adminUserId") ?? "",
    action: params.get("action") ?? "all",
    target: params.get("target") ?? "",
    limit: 1000,
  };
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!(await hasAdminPermission(admin.id, "security.logs.export"))) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const rows = await listSecurityAuditLogs(filtersFromUrl(request.url));
  const headers = [
    "created_at",
    "admin_user_id",
    "action",
    "target_type",
    "target_id",
    "reason",
    "ip",
    "user_agent",
    "before_value",
    "after_value",
  ];
  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => [
      row.createdAt,
      row.adminUserId ?? "",
      row.action,
      row.targetType,
      row.targetId,
      row.reason,
      row.ip,
      row.userAgent,
      JSON.stringify(row.beforeValue),
      JSON.stringify(row.afterValue),
    ].map(csvCell).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="security-audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
