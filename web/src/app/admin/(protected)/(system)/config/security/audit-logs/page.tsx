import Link from "next/link";
import { Radio } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { AdminTableActionButton } from "@/features/admin/components/admin-table-actions";
import { AdminTableToolbar } from "@/features/admin/components/admin-table-controls";
import { requireAdminPermission } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import {
  listSecurityAuditActions,
  listSecurityAuditLogs,
  type SecurityAuditLogFilters,
} from "@/lib/security-audit-logs";

function param(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function compactDate(value: string | null) {
  if (!value) return "n/a";
  return new Date(value).toISOString().slice(0, 16).replace("T", " ");
}

function buildFilters(params: Record<string, string | string[] | undefined>): SecurityAuditLogFilters {
  return {
    from: param(params, "from"),
    to: param(params, "to"),
    adminUserId: param(params, "adminUserId"),
    action: param(params, "action") || "all",
    target: param(params, "target"),
    limit: 250,
  };
}

function buildExportHref(filters: SecurityAuditLogFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, String(value));
  }
  return `${ROUTES.API.ADMIN.SECURITY.AUDIT_LOGS_EXPORT}?${params.toString()}`;
}

function jsonPreview(value: unknown) {
  const text = JSON.stringify(value ?? null);
  return text.length > 160 ? `${text.slice(0, 160)}...` : text;
}

export default async function AdminSecurityAuditLogsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPermission("security.logs.view");
  const params = (await searchParams) ?? {};
  const filters = buildFilters(params);
  const [rows, actions] = await Promise.all([
    listSecurityAuditLogs(filters),
    listSecurityAuditActions(),
  ]);
  const hasFilters = Object.entries(filters).some(([key, value]) => key !== "limit" && Boolean(value) && value !== "all");

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid>
        <AdminOverviewCard title="Audit Rows" value={rows.length.toLocaleString()} icon={Radio} />
        <AdminOverviewCard title="Actions" value={actions.length.toLocaleString()} icon={Radio} />
        <AdminOverviewCard title="Latest" value={compactDate(rows[0]?.createdAt ?? null)} icon={Radio} />
      </AdminOverviewGrid>

      <Card className="rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardTitle className="text-sm font-medium">Security Audit Logs</CardTitle>
          <Radio className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <NativeForm action={ROUTES.ADMIN.SECURITY_AUDIT_LOGS} method="GET">
              <AdminTableToolbar>
                <input name="from" type="datetime-local" defaultValue={filters.from} className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none" />
                <input name="to" type="datetime-local" defaultValue={filters.to} className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none" />
                <select name="action" defaultValue={filters.action ?? "all"} className="h-9 min-w-56 rounded-lg border border-input bg-background px-3 text-sm outline-none">
                  <option value="all">All actions</option>
                  {actions.map((action) => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
                <input name="adminUserId" defaultValue={filters.adminUserId} placeholder="Admin user ID..." className="h-9 w-48 rounded-lg border border-input bg-background px-3 text-sm outline-none" />
                <input name="target" defaultValue={filters.target} placeholder="Target type/id..." className="h-9 w-56 rounded-lg border border-input bg-background px-3 text-sm outline-none" />
                <AdminSubmitButton>Lọc</AdminSubmitButton>
                {hasFilters ? (
                  <Link href={ROUTES.ADMIN.SECURITY_AUDIT_LOGS}>
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
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Before</TableHead>
                  <TableHead>After</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length ? rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-xs">{compactDate(row.createdAt)}</TableCell>
                    <TableCell className="font-mono text-xs">{row.adminUserId ?? "n/a"}</TableCell>
                    <TableCell className="font-mono text-xs">{row.action}</TableCell>
                    <TableCell className="font-mono text-xs">{row.targetType}:{row.targetId}</TableCell>
                    <TableCell className="max-w-72 truncate" title={row.reason}>{row.reason || "n/a"}</TableCell>
                    <TableCell className="max-w-72 truncate font-mono text-xs" title={JSON.stringify(row.beforeValue)}>{jsonPreview(row.beforeValue)}</TableCell>
                    <TableCell className="max-w-72 truncate font-mono text-xs" title={JSON.stringify(row.afterValue)}>{jsonPreview(row.afterValue)}</TableCell>
                    <TableCell className="font-mono text-xs">{row.ip}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Không có audit log phù hợp.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
