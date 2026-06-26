import Link from "next/link";
import { ShieldBan } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { AdminTableActionButton } from "@/features/admin/components/admin-table-actions";
import { AdminTableToolbar } from "@/features/admin/components/admin-table-controls";
import { requireAdminPermission } from "@/lib/auth";
import { listBlockedIps } from "@/lib/blocked-ips";
import { ROUTES } from "@/lib/routes";

function param(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function compactDate(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toISOString().slice(0, 16).replace("T", " ");
}

export default async function AdminBlockedIpsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPermission("security.ip_blocks.manage");
  const params = (await searchParams) ?? {};
  const status = param(params, "status") || "active";
  const queryText = param(params, "q");
  const rows = await listBlockedIps({ status, queryText, limit: 250 });
  const activeCount = rows.filter((row) => row.status === "active").length;
  const expiredCount = rows.filter((row) => row.status === "expired").length;
  const revokedCount = rows.filter((row) => row.status === "revoked").length;
  const hasFilters = status !== "active" || queryText.trim().length > 0;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid>
        <AdminOverviewCard title="Visible Blocks" value={rows.length.toLocaleString()} icon={ShieldBan} />
        <AdminOverviewCard title="Active" value={activeCount.toLocaleString()} icon={ShieldBan} />
        <AdminOverviewCard title="Expired" value={expiredCount.toLocaleString()} icon={ShieldBan} />
        <AdminOverviewCard title="Revoked" value={revokedCount.toLocaleString()} icon={ShieldBan} />
      </AdminOverviewGrid>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Thêm block IP/Subnet</CardTitle>
          </CardHeader>
          <CardContent>
            <NativeForm action={ROUTES.API.ADMIN.SECURITY.BLOCKED_IPS_ACTION} method="POST" className="space-y-3">
              <input type="hidden" name="intent" value="create" />
              <input name="ipOrCidr" placeholder="Ví dụ: 203.0.113.10 hoặc 203.0.113.0/24" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none" />
              <textarea name="reason" placeholder="Lý do block..." className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none" />
              <div className="grid gap-3 md:grid-cols-2">
                <select name="durationMinutes" defaultValue="60" className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none">
                  <option value="15">15 phút</option>
                  <option value="60">1 giờ</option>
                  <option value="1440">24 giờ</option>
                  <option value="custom">Custom minutes</option>
                </select>
                <input name="customDurationMinutes" placeholder="Custom minutes" className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none" />
              </div>
              <input name="confirmSelfBlock" placeholder="Nếu khớp IP admin hiện tại, nhập BLOCK_MY_IP" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none" />
              <AdminSubmitButton>Thêm block</AdminSubmitButton>
            </NativeForm>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Import danh sách</CardTitle>
          </CardHeader>
          <CardContent>
            <NativeForm action={ROUTES.API.ADMIN.SECURITY.BLOCKED_IPS_ACTION} method="POST" className="space-y-3">
              <input type="hidden" name="intent" value="import" />
              <textarea name="bulkIpOrCidr" placeholder="Mỗi dòng một IP/CIDR hoặc phân tách bằng dấu phẩy." className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none" />
              <textarea name="reason" placeholder="Lý do block..." className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none" />
              <div className="grid gap-3 md:grid-cols-2">
                <select name="durationMinutes" defaultValue="60" className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none">
                  <option value="15">15 phút</option>
                  <option value="60">1 giờ</option>
                  <option value="1440">24 giờ</option>
                  <option value="custom">Custom minutes</option>
                </select>
                <input name="customDurationMinutes" placeholder="Custom minutes" className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none" />
              </div>
              <input name="confirmSelfBlock" placeholder="Nếu khớp IP admin hiện tại, nhập BLOCK_MY_IP" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none" />
              <AdminSubmitButton>Import blocks</AdminSubmitButton>
            </NativeForm>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardTitle className="text-sm font-medium">Blocked IPs/Subnets</CardTitle>
          <ShieldBan className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-5">
          <NativeForm action={ROUTES.ADMIN.SECURITY_BLOCKED_IPS} method="GET">
            <AdminTableToolbar>
              <select name="status" defaultValue={status} className="h-9 min-w-40 rounded-lg border border-input bg-background px-3 text-sm outline-none">
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
                <option value="all">All statuses</option>
              </select>
              <input name="q" defaultValue={queryText} placeholder="Search IP/CIDR hoặc reason..." className="h-9 min-w-72 rounded-lg border border-input bg-background px-3 text-sm outline-none" />
              <AdminSubmitButton>Lọc</AdminSubmitButton>
              {hasFilters ? (
                <Link href={ROUTES.ADMIN.SECURITY_BLOCKED_IPS}>
                  <AdminTableActionButton action="clear" label="Clear filters" />
                </Link>
              ) : null}
            </AdminTableToolbar>
          </NativeForm>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP/CIDR</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Revoked</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length ? rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.ipOrCidr}</TableCell>
                    <TableCell>
                      <Badge className={row.status === "active" ? "text-red-700" : "text-muted-foreground"}>{row.status}</Badge>
                    </TableCell>
                    <TableCell className="max-w-80 truncate" title={row.reason}>{row.reason || "n/a"}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{compactDate(row.expiresAt)}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{compactDate(row.createdAt)}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{compactDate(row.revokedAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        {row.status !== "revoked" ? (
                          <>
                            <NativeForm action={ROUTES.API.ADMIN.SECURITY.BLOCKED_IPS_ACTION} method="POST" className="inline-flex gap-2">
                              <input type="hidden" name="intent" value="extend" />
                              <input type="hidden" name="id" value={row.id} />
                              <select name="durationMinutes" defaultValue="60" className="h-8 rounded-md border bg-background px-2 text-xs">
                                <option value="15">15m</option>
                                <option value="60">1h</option>
                                <option value="1440">24h</option>
                              </select>
                              <AdminTableActionButton action="edit" label="Gia hạn" type="submit" />
                            </NativeForm>
                            <NativeForm action={ROUTES.API.ADMIN.SECURITY.BLOCKED_IPS_ACTION} method="POST">
                              <input type="hidden" name="intent" value="revoke" />
                              <input type="hidden" name="id" value={row.id} />
                              <AdminTableActionButton action="delete" label="Unblock" type="submit" />
                            </NativeForm>
                          </>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Không có block phù hợp.
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
