import { Archive, CheckCircle2, Clock3, HardDrive, ShieldAlert, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { AdminBackupsManager } from "@/features/admin/components/settings/admin-backups-manager";
import { getAdminBackupSecurityStatus, listAdminBackupPackages } from "@/lib/admin-backups";
import { requireAdminPermission } from "@/lib/auth";

function formatBytes(value: number) {
  if (value === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const amount = value / 1024 ** exponent;

  return `${amount >= 10 || exponent === 0 ? amount.toFixed(0) : amount.toFixed(1)} ${units[exponent]}`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(value);
}

export default async function AdminBackupsPage() {
  await requireAdminPermission("security.backups.view");
  const [status, packages] = [getAdminBackupSecurityStatus(), await listAdminBackupPackages()];
  const latestPackage = packages[0];
  const totalSize = packages.reduce((sum, item) => sum + item.size, 0);
  const checksumCount = packages.filter((item) => item.checksum).length;
  const encryptedCount = packages.filter((item) => item.encrypted).length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid>
        <AdminOverviewCard title="Backup packages" value={packages.length} icon={Archive} />
        <AdminOverviewCard title="Latest backup" icon={Clock3}>
          <p className="line-clamp-1">{latestPackage ? formatDate(new Date(latestPackage.createdAt)) : "Chưa có"}</p>
        </AdminOverviewCard>
        <AdminOverviewCard title="Local size" value={formatBytes(totalSize)} icon={HardDrive} />
        <AdminOverviewCard title="Checksums" value={`${checksumCount}/${packages.length}`} icon={CheckCircle2} />
        <AdminOverviewCard title="Encryption" value={status.encryption.enabled ? status.encryption.mode : "Missing"} icon={status.encryption.enabled ? ShieldCheck : ShieldAlert} />
        <AdminOverviewCard title="Schedule" value={status.schedule.enabled ? status.schedule.cadence : "Manual only"} icon={Clock3} />
        <AdminOverviewCard title="Retention" value={`${status.retention.days}d / keep ${status.retention.minCopies}`} icon={Archive} />
        <AdminOverviewCard title="Encrypted packages" value={`${encryptedCount}/${packages.length}`} icon={ShieldCheck} />
      </AdminOverviewGrid>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Backup / Restore Security Status</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-muted-foreground lg:grid-cols-2">
          <div>
            <p className="font-medium text-foreground">Dữ liệu cần backup</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {status.dataClasses.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground">Vận hành an toàn</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Cron endpoint: {status.schedule.cronEndpoint}</li>
              <li>Offsite storage: {status.offsite.configured ? status.offsite.label : "Not configured"}</li>
              <li>UI chỉ hiển thị metadata an toàn, không hiển thị secret hoặc full path.</li>
              <li>Restore bắt buộc checksum hợp lệ và xác nhận RESTORE.</li>
            </ul>
          </div>
          {status.warnings.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 lg:col-span-2">
              <p className="font-medium">Cảnh báo cấu hình</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {status.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <AdminBackupsManager packages={packages} />
    </section>
  );
}
