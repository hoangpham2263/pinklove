import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";
import { ensureAdminBackupDirectory, getAdminBackupDirectory } from "@/lib/admin-backups";
import { getSystemSettings } from "@/lib/system-settings";

const execFileAsync = promisify(execFile);
const ENCRYPTED_BACKUP_MAGIC = "PLBACKUPENC1";

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

async function copyToRemoteStorage(filePath: string) {
  const remoteDir = process.env.BACKUP_REMOTE_DIR?.trim();
  if (!remoteDir) return false;

  await fs.mkdir(remoteDir, { recursive: true });
  await fs.copyFile(filePath, path.join(remoteDir, path.basename(filePath)));
  await fs.copyFile(`${filePath}.sha256`, path.join(remoteDir, `${path.basename(filePath)}.sha256`));
  return true;
}

function getBackupEncryptionKey() {
  const raw = process.env.BACKUP_ENCRYPTION_KEY?.trim();
  if (!raw) return null;

  return createHash("sha256").update(raw).digest();
}

async function encryptBackupFile(inputPath: string, outputPath: string) {
  const key = getBackupEncryptionKey();
  if (!key) return false;

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const input = await fs.readFile(inputPath);
  const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);
  const authTag = cipher.getAuthTag();

  await fs.writeFile(outputPath, Buffer.concat([
    Buffer.from(ENCRYPTED_BACKUP_MAGIC),
    iv,
    authTag,
    encrypted,
  ]));
  return true;
}

async function decryptBackupFile(inputPath: string, outputPath: string) {
  const key = getBackupEncryptionKey();
  if (!key) {
    throw new Error("BACKUP_ENCRYPTION_KEY is required to restore encrypted backup.");
  }

  const payload = await fs.readFile(inputPath);
  const magic = payload.subarray(0, ENCRYPTED_BACKUP_MAGIC.length).toString("utf8");
  if (magic !== ENCRYPTED_BACKUP_MAGIC) {
    throw new Error("Encrypted backup header is invalid.");
  }

  const ivStart = ENCRYPTED_BACKUP_MAGIC.length;
  const authTagStart = ivStart + 12;
  const encryptedStart = authTagStart + 16;
  const iv = payload.subarray(ivStart, authTagStart);
  const authTag = payload.subarray(authTagStart, encryptedStart);
  const encrypted = payload.subarray(encryptedStart);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);

  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  await fs.writeFile(outputPath, decrypted);
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
    const plainBackupFilePath = path.join(workDir, `${backupName}.tar.gz`);
    const encryptedBackupFilePath = path.join(backupDirectory, `${backupName}.tar.gz.enc`);
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
          encryption: {
            enabled: Boolean(getBackupEncryptionKey()),
            mode: getBackupEncryptionKey() ? "aes-256-gcm" : "none",
          },
          retention: {
            days: Number(process.env.BACKUP_RETENTION_DAYS || "14"),
            minCopies: Number(process.env.BACKUP_RETENTION_MIN_COPIES || "3"),
          },
        },
        null,
        2
      )
    );

    await run("tar", ["-czf", plainBackupFilePath, "-C", workDir, "manifest.json", "database.dump", "uploads.tar.gz"]);

    const encrypted = await encryptBackupFile(plainBackupFilePath, encryptedBackupFilePath);
    const finalBackupFilePath = encrypted ? encryptedBackupFilePath : backupFilePath;
    if (!encrypted) {
      await fs.copyFile(plainBackupFilePath, backupFilePath);
    }
    await writeSha256(finalBackupFilePath);
    await copyToRemoteStorage(finalBackupFilePath);

    return finalBackupFilePath;
  });
}

export async function runRestoreScript(filePath: string) {
  return withWorkDir(async (workDir) => {
    const restorePackagePath = filePath.endsWith(".enc") ? path.join(workDir, "restore-package.tar.gz") : filePath;
    if (filePath.endsWith(".enc")) {
      await decryptBackupFile(filePath, restorePackagePath);
    }

    await run("tar", ["-xzf", restorePackagePath, "-C", workDir]);

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
