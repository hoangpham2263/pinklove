import { promises as fs } from "fs";
import path from "path";

export type AdminBackupPackage = {
  name: string;
  size: number;
  createdAt: string;
  checksum: boolean;
};

const BACKUP_FILE_PATTERN = /^[a-zA-Z0-9._-]+\.tar\.gz$/;

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
        };
      })
    );

    return packages.sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));
  } catch {
    return [];
  }
}
