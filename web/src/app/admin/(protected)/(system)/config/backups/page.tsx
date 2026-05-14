import { Archive, CheckCircle2, Clock3, HardDrive } from "lucide-react";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { AdminBackupsManager } from "@/features/admin/components/settings/admin-backups-manager";
import { getAdminBackupDirectory, listAdminBackupPackages } from "@/lib/admin-backups";
import { requireAdmin } from "@/lib/auth";

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
  await requireAdmin();
  const [directory, packages] = [getAdminBackupDirectory(), await listAdminBackupPackages()];
  const latestPackage = packages[0];
  const totalSize = packages.reduce((sum, item) => sum + item.size, 0);
  const checksumCount = packages.filter((item) => item.checksum).length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid>
        <AdminOverviewCard title="Backup packages" value={packages.length} icon={Archive} />
        <AdminOverviewCard title="Latest backup" icon={Clock3}>
          <p className="line-clamp-1">{latestPackage ? formatDate(new Date(latestPackage.createdAt)) : "Chưa có"}</p>
        </AdminOverviewCard>
        <AdminOverviewCard title="Local size" value={formatBytes(totalSize)} icon={HardDrive} />
        <AdminOverviewCard title="Checksums" value={`${checksumCount}/${packages.length}`} icon={CheckCircle2} />
      </AdminOverviewGrid>

      <AdminBackupsManager packages={packages} directory={directory} />
    </section>
  );
}
