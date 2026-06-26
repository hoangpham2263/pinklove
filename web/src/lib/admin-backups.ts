import { promises as fs } from "fs";
import { createHash } from "crypto";
import path from "path";
import { ROUTES } from "@/lib/routes";

export type AdminBackupPackage = {
  name: string;
  size: number;
  createdAt: string;
  checksum: boolean;
  encrypted: boolean;
  integrityStatus: "ready" | "missing_checksum" | "failed";
};

export type AdminBackupSecurityStatus = {
  dataClasses: string[];
  schedule: {
    enabled: boolean;
    cadence: string;
    cronEndpoint: string;
  };
  retention: {
    days: number;
    minCopies: number;
  };
  encryption: {
    enabled: boolean;
    mode: "application" | "storage_at_rest" | "missing";
  };
  offsite: {
    configured: boolean;
    label: string;
  };
  safeMetadataOnly: boolean;
  warnings: string[];
};

export type AdminBackupIntegrityResult = {
  ok: boolean;
  name: string;
  message: string;
  expected?: string;
  actual?: string;
};

const BACKUP_FILE_PATTERN = /^[a-zA-Z0-9._-]+\.tar\.gz(?:\.enc)?$/;

export function getAdminBackupDirectory() {
  return path.join(process.cwd(), "data", "backups");
}

export function assertBackupFileName(value: string) {
  const name = path.basename(value.trim());

  if (!BACKUP_FILE_PATTERN.test(name)) {
    throw new Error("Tên file backup không hợp lệ.");
  }

  return name;
}

export function getAdminBackupFilePath(name: string) {
  return path.join(getAdminBackupDirectory(), assertBackupFileName(name));
}

export async function ensureAdminBackupDirectory() {
  await fs.mkdir(getAdminBackupDirectory(), { recursive: true });
}

export async function listAdminBackupPackages(): Promise<AdminBackupPackage[]> {
  const directory = getAdminBackupDirectory();

  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const packageNames = entries
      .filter((entry) => entry.isFile() && BACKUP_FILE_PATTERN.test(entry.name))
      .map((entry) => entry.name);

    const packages = await Promise.all(
      packageNames.map(async (name) => {
        const filePath = path.join(directory, name);
        const stats = await fs.stat(filePath);

        return {
          name,
          size: stats.size,
          createdAt: stats.mtime.toISOString(),
          checksum: await fs
            .access(`${filePath}.sha256`)
            .then(() => true)
            .catch(() => false),
          encrypted: name.endsWith(".enc"),
          integrityStatus: await verifyAdminBackupPackage(name).then((result) => result.ok ? "ready" as const : "failed" as const).catch(() => "missing_checksum" as const),
        };
      })
    );

    return packages.sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));
  } catch {
    return [];
  }
}

function parsePositiveInt(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

export function getAdminBackupRetentionPolicy() {
  return {
    days: parsePositiveInt(process.env.BACKUP_RETENTION_DAYS, 14, 1, 3650),
    minCopies: parsePositiveInt(process.env.BACKUP_RETENTION_MIN_COPIES, 3, 1, 500),
  };
}

export function getAdminBackupSecurityStatus(): AdminBackupSecurityStatus {
  const retention = getAdminBackupRetentionPolicy();
  const appEncryptionEnabled = Boolean(process.env.BACKUP_ENCRYPTION_KEY?.trim());
  const storageEncryptionEnabled = process.env.BACKUP_STORAGE_ENCRYPTION_AT_REST === "true";
  const remoteConfigured = Boolean(process.env.BACKUP_REMOTE_DIR?.trim() || process.env.BACKUP_REMOTE_LABEL?.trim() || process.env.BACKUP_REMOTE_PROVIDER?.trim());
  const remoteLabel = process.env.BACKUP_REMOTE_LABEL?.trim() || process.env.BACKUP_REMOTE_PROVIDER?.trim() || (process.env.BACKUP_REMOTE_DIR?.trim() ? "Configured external backup directory" : "");
  const scheduleEnabled = process.env.BACKUP_CRON_ENABLED === "true";
  const warnings: string[] = [];

  if (!appEncryptionEnabled && !storageEncryptionEnabled) {
    warnings.push("Backup encryption chưa được cấu hình. Dùng BACKUP_ENCRYPTION_KEY hoặc storage encryption-at-rest.");
  }

  if (!remoteConfigured) {
    warnings.push("Chưa cấu hình vị trí backup tách biệt server chính.");
  }

  if (!scheduleEnabled) {
    warnings.push("Chưa bật lịch backup định kỳ qua BACKUP_CRON_ENABLED=true và external cron.");
  }

  return {
    dataClasses: ["PostgreSQL database", "public/uploads media", "safe backup manifest"],
    schedule: {
      enabled: scheduleEnabled,
      cadence: process.env.BACKUP_CRON_CADENCE?.trim() || "daily database, media with each package",
      cronEndpoint: ROUTES.API.ADMIN.SECURITY.BACKUPS_CRON,
    },
    retention,
    encryption: {
      enabled: appEncryptionEnabled || storageEncryptionEnabled,
      mode: appEncryptionEnabled ? "application" : storageEncryptionEnabled ? "storage_at_rest" : "missing",
    },
    offsite: {
      configured: remoteConfigured,
      label: remoteLabel || "Not configured",
    },
    safeMetadataOnly: true,
    warnings,
  };
}

async function sha256File(filePath: string) {
  const buffer = await fs.readFile(filePath);
  return createHash("sha256").update(buffer).digest("hex");
}

export async function verifyAdminBackupPackage(name: string): Promise<AdminBackupIntegrityResult> {
  const filePath = getAdminBackupFilePath(name);
  const checksumPath = `${filePath}.sha256`;
  const checksumContent = await fs.readFile(checksumPath, "utf8").catch(() => "");
  const expected = checksumContent.trim().split(/\s+/)[0] ?? "";

  if (!expected || !/^[a-f0-9]{64}$/i.test(expected)) {
    return {
      ok: false,
      name,
      message: "Backup package thiếu checksum hợp lệ.",
    };
  }

  const actual = await sha256File(filePath);
  return {
    ok: expected.toLowerCase() === actual.toLowerCase(),
    name,
    message: expected.toLowerCase() === actual.toLowerCase() ? "Checksum hợp lệ." : "Checksum không khớp.",
    expected,
    actual,
  };
}

export async function cleanupExpiredAdminBackups() {
  const packages = await listAdminBackupPackages();
  const policy = getAdminBackupRetentionPolicy();
  const cutoff = Date.now() - policy.days * 24 * 60 * 60 * 1000;
  const removable = packages.slice(policy.minCopies).filter((item) => Date.parse(item.createdAt) < cutoff);
  const deleted: string[] = [];

  for (const item of removable) {
    const filePath = getAdminBackupFilePath(item.name);
    await fs.unlink(filePath).catch(() => undefined);
    await fs.unlink(`${filePath}.sha256`).catch(() => undefined);
    deleted.push(item.name);
  }

  return {
    deleted,
    policy,
  };
}
