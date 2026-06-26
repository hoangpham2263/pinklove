import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { AdminTableActionButton } from "@/features/admin/components/admin-table-actions";
import { AdminTableToolbar } from "@/features/admin/components/admin-table-controls";
import { requireAdminPermission } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import {
  SECURITY_EVENT_TYPE_OPTIONS,
  getSecurityEventSummary,
  listSecurityEvents,
  type SecurityEventFilters,
} from "@/lib/security-events";

function param(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function buildFilters(params: Record<string, string | string[] | undefined>): SecurityEventFilters {
  return {
    from: param(params, "from"),
    to: param(params, "to"),
    eventType: param(params, "eventType") || "all",
    ip: param(params, "ip"),
    userId: param(params, "userId"),
    path: param(params, "path"),
    status: param(params, "status"),
    suspiciousOnly: param(params, "suspiciousOnly") === "1",
    limit: 250,
  };
}

function compactDate(value: string | null) {
  if (!value) return "n/a";
  return new Date(value).toISOString().slice(0, 16).replace("T", " ");
}

function buildExportHref(filters: SecurityEventFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (typeof value === "boolean") {
      if (value) params.set(key, "1");
    } else if (typeof value === "number") {
      params.set(key, String(value));
    } else if (value) {
      params.set(key, value);
    }
  }
  return `${ROUTES.API.ADMIN.SECURITY.EVENTS_EXPORT}?${params.toString()}`;
}

export default async function AdminSecurityLogsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPermission("security.logs.view");
  const params = (await searchParams) ?? {};
  const filters = buildFilters(params);
  const [rows, summary] = await Promise.all([
    listSecurityEvents(filters),
    getSecurityEventSummary(filters),
  ]);
  const hasFilters = Object.entries(filters).some(([key, value]) => key !== "limit" && Boolean(value));

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid>
        <AdminOverviewCard title="Security Events" value={summary.totalEvents.toLocaleString()} icon={ShieldAlert} />
        <AdminOverviewCard title="Login Fail" value={summary.loginFails.toLocaleString()} icon={ShieldAlert} />
        <AdminOverviewCard title="Register Fail" value={summary.registerFails.toLocaleString()} icon={ShieldAlert} />
        <AdminOverviewCard title="Rate Limit Hits" value={summary.rateLimitHits.toLocaleString()} icon={ShieldAlert} />
        <AdminOverviewCard title="CSRF Fail" value={summary.csrfFails.toLocaleString()} icon={ShieldAlert} />
        <AdminOverviewCard title="Window" value={`${compactDate(summary.firstSeen)} - ${compactDate(summary.lastSeen)}`} icon={ShieldAlert} />
      </AdminOverviewGrid>

      <Card className="rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardTitle className="text-sm font-medium">Security Logs</CardTitle>
          <ShieldAlert className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <NativeForm action={ROUTES.ADMIN.SECURITY_LOGS} method="GET" className="flex flex-col gap-3">
              <AdminTableToolbar>
                <input name="from" type="datetime-local" defaultValue={filters.from} className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none" />
                <input name="to" type="datetime-local" defaultValue={filters.to} className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none" />
                <select name="eventType" defaultValue={filters.eventType ?? "all"} className="h-9 min-w-45 rounded-lg border border-input bg-background px-3 text-sm outline-none">
                  {SECURITY_EVENT_TYPE_OPTIONS.map((eventType) => (
                    <option key={eventType} value={eventType}>{eventType === "all" ? "All event types" : eventType}</option>
                  ))}
                </select>
                <input name="ip" defaultValue={filters.ip} placeholder="IP..." className="h-9 w-40 rounded-lg border border-input bg-background px-3 text-sm outline-none" />
                <input name="userId" defaultValue={filters.userId} placeholder="User ID..." className="h-9 w-48 rounded-lg border border-input bg-background px-3 text-sm outline-none" />
                <input name="path" defaultValue={filters.path} placeholder="Path contains..." className="h-9 w-56 rounded-lg border border-input bg-background px-3 text-sm outline-none" />
                <input name="status" defaultValue={filters.status} placeholder="Status..." className="h-9 w-28 rounded-lg border border-input bg-background px-3 text-sm outline-none" />
                <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm">
                  <input type="checkbox" name="suspiciousOnly" value="1" defaultChecked={filters.suspiciousOnly} />
                  Suspicious only
                </label>
                <AdminSubmitButton>Lọc</AdminSubmitButton>
                {hasFilters ? (
                  <Link href={ROUTES.ADMIN.SECURITY_LOGS}>
                    <AdminTableActionButton action="clear" label="Clear filters" />
                  </Link>
                ) : null}
              </AdminTableToolbar>
            </NativeForm>

            <Link href={buildExportHref(filters)}>
              <AdminTableActionButton action="download" label="Export CSV" />
            </Link>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>User agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length ? rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-xs">{compactDate(row.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={row.severity === "info" ? "secondary" : "default"}>{row.eventType}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.ip}</TableCell>
                    <TableCell>{row.method}</TableCell>
                    <TableCell className="max-w-80 truncate" title={row.path}>{row.path}</TableCell>
                    <TableCell>{row.status ?? "n/a"}</TableCell>
                    <TableCell className="font-mono text-xs">{row.userId ?? "n/a"}</TableCell>
                    <TableCell className="max-w-80 truncate text-xs text-muted-foreground" title={row.userAgent}>{row.userAgent || "n/a"}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Không có security event phù hợp.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <SecurityStatsCard title="Top IP request nhiều" rows={summary.topIps.map((row) => [row.ip, row.count, `${compactDate(row.firstSeen)} - ${compactDate(row.lastSeen)}`])} />
        <SecurityStatsCard title="Top IP login fail" rows={summary.topLoginFailIps.map((row) => [row.ip, row.count])} />
        <SecurityStatsCard title="Top path 404/403" rows={summary.topBlockedPaths.map((row) => [row.path, row.count, `HTTP ${row.status}`])} />
        <SecurityStatsCard title="Rate-limit hit theo giờ" rows={summary.rateLimitHitsByHour.map((row) => [compactDate(row.hour), row.count])} />
      </div>
    </section>
  );
}

function SecurityStatsCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<Array<string | number>>;
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableBody>
              {rows.length ? rows.map((row, index) => (
                <TableRow key={`${title}-${index}`}>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex} className={cellIndex === 0 ? "max-w-96 truncate font-mono text-xs" : "text-sm"}>
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell className="h-20 text-center text-muted-foreground">Chưa có dữ liệu.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
