import { createHash } from "crypto";
import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";
import { ensureAdminBackupDirectory, getAdminBackupDirectory } from "@/lib/admin-backups";
import { getSystemSettings } from "@/lib/system-settings";

const execFileAsync = promisify(execFile);

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  return databaseUrl;
}

function getUploadsDirectory() {
  return path.join(process.cwd(), "public", "uploads");
}

function slugifyBackupPrefix(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "website";
}

function formatBackupTimestamp(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).formatToParts(value);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${lookup.year}${lookup.month}${lookup.day}-${lookup.hour}${lookup.minute}${lookup.second}`;
}

async function getBackupName() {
  const settings = await getSystemSettings();
  const siteName = settings.branding.siteName || process.env.COMPOSE_PROJECT_NAME || "website";
  const timestamp = formatBackupTimestamp(new Date());

  return `${slugifyBackupPrefix(siteName)}-${timestamp}`;
}

async function pathSize(filePath: string) {
  const stats = await fs.stat(filePath);
  return stats.size;
}

async function writeSha256(filePath: string) {
  const buffer = await fs.readFile(filePath);
  const checksum = createHash("sha256").update(buffer).digest("hex");

  await fs.writeFile(`${filePath}.sha256`, `${checksum}  ${path.basename(filePath)}\n`);
}

async function withWorkDir<T>(callback: (workDir: string) => Promise<T>) {
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "pinklove-backup-"));

  try {
    return await callback(workDir);
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}

function trimOutput(value: string) {
  return value.length > 2000 ? value.slice(-2000) : value;
}

async function run(command: string, args: string[], options?: { cwd?: string }) {
  const { stdout, stderr } = await execFileAsync(command, args, {
    cwd: options?.cwd,
    timeout: 10 * 60 * 1000,
    maxBuffer: 1024 * 1024 * 4,
  });

  return [stdout, stderr].filter(Boolean).map(trimOutput).join("\n");
}

export async function runBackupScript() {
  await ensureAdminBackupDirectory();

  return withWorkDir(async (workDir) => {
    const backupDirectory = getAdminBackupDirectory();
    const backupName = await getBackupName();
    const backupFilePath = path.join(backupDirectory, `${backupName}.tar.gz`);
    const databaseDumpPath = path.join(workDir, "database.dump");
    const uploadsArchivePath = path.join(workDir, "uploads.tar.gz");
    const manifestPath = path.join(workDir, "manifest.json");
    const uploadsDirectory = getUploadsDirectory();

    await fs.mkdir(uploadsDirectory, { recursive: true });

    await run("pg_dump", ["--format=custom", "--file", databaseDumpPath, getDatabaseUrl()]);
    await run("tar", ["-czf", uploadsArchivePath, "-C", path.join(process.cwd(), "public"), "uploads"]);

    const databaseSize = await pathSize(databaseDumpPath);
    const uploadsSize = await pathSize(uploadsArchivePath);

    await fs.writeFile(
      manifestPath,
      JSON.stringify(
        {
          app: "pinklove",
          backupVersion: 1,
          createdAt: new Date().toISOString(),
          source: "admin",
          database: {
            format: "pg_dump custom",
            file: "database.dump",
            sizeBytes: databaseSize,
          },
          uploads: {
            file: "uploads.tar.gz",
            sizeBytes: uploadsSize,
          },
        },
        null,
        2
      )
    );

    await run("tar", ["-czf", backupFilePath, "-C", workDir, "manifest.json", "database.dump", "uploads.tar.gz"]);
    await writeSha256(backupFilePath);

    return backupFilePath;
  });
}

export async function runRestoreScript(filePath: string) {
  return withWorkDir(async (workDir) => {
    await run("tar", ["-xzf", filePath, "-C", workDir]);

    const databaseDumpPath = path.join(workDir, "database.dump");
    const uploadsArchivePath = path.join(workDir, "uploads.tar.gz");

    await fs.access(databaseDumpPath);
    await fs.access(uploadsArchivePath);

    await run("pg_restore", ["--clean", "--if-exists", "--no-owner", "--dbname", getDatabaseUrl(), databaseDumpPath]);

    const publicDirectory = path.join(process.cwd(), "public");
    await fs.mkdir(publicDirectory, { recursive: true });
    await fs.rm(getUploadsDirectory(), { recursive: true, force: true });
    await run("tar", ["-xzf", uploadsArchivePath, "-C", publicDirectory]);

    return filePath;
  });
}
