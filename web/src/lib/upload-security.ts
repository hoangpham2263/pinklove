import "server-only";

import path from "node:path";

import { getSystemSettings, type SecuritySettings } from "@/lib/system-settings";

export type UploadSecurityReason =
  | "disabled"
  | "file_required"
  | "too_many_files"
  | "total_size_exceeded"
  | "file_too_large"
  | "extension_blocked"
  | "mime_blocked"
  | "magic_bytes_mismatch";

export class UploadSecurityError extends Error {
  constructor(
    public reason: UploadSecurityReason,
    message: string,
    public metadata: Record<string, unknown> = {}
  ) {
    super(message);
  }
}

type UploadRule = {
  mimeType: string;
  extensions: string[];
  matches: (buffer: Buffer) => boolean;
};

const UPLOAD_RULES: UploadRule[] = [
  {
    mimeType: "image/jpeg",
    extensions: [".jpg", ".jpeg"],
    matches: (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  },
  {
    mimeType: "image/png",
    extensions: [".png"],
    matches: (buffer) => buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mimeType: "image/gif",
    extensions: [".gif"],
    matches: (buffer) => buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a",
  },
  {
    mimeType: "image/webp",
    extensions: [".webp"],
    matches: (buffer) => buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP",
  },
  {
    mimeType: "application/pdf",
    extensions: [".pdf"],
    matches: (buffer) => buffer.subarray(0, 5).toString("ascii") === "%PDF-",
  },
  {
    mimeType: "video/mp4",
    extensions: [".mp4", ".m4v"],
    matches: (buffer) => buffer.subarray(4, 8).toString("ascii") === "ftyp",
  },
  {
    mimeType: "audio/mp4",
    extensions: [".m4a"],
    matches: (buffer) => buffer.subarray(4, 8).toString("ascii") === "ftyp",
  },
  {
    mimeType: "audio/mpeg",
    extensions: [".mp3"],
    matches: (buffer) =>
      buffer.subarray(0, 3).toString("ascii") === "ID3" ||
      (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0),
  },
];

const DANGEROUS_EXTENSIONS = new Set([".svg", ".html", ".htm", ".js", ".mjs", ".jsx", ".ts", ".tsx", ".php", ".phtml"]);
const DANGEROUS_MIME_TYPES = new Set(["image/svg+xml", "text/html", "application/xhtml+xml", "application/javascript", "text/javascript"]);

function normalizeMimeType(value: string) {
  return value.trim().toLowerCase().split(";")[0] ?? "";
}

function getExtension(fileName: string) {
  return path.extname(fileName).toLowerCase();
}

function allowedMimeTypes(settings: SecuritySettings["uploadSecurity"]) {
  return new Set(
    settings.allowedMimeTypes
      .split(/[,\n]+/g)
      .map((item) => normalizeMimeType(item))
      .filter(Boolean)
  );
}

function findRule(mimeType: string, extension: string) {
  return UPLOAD_RULES.find((rule) => rule.mimeType === mimeType && rule.extensions.includes(extension));
}

export async function getUploadSecuritySettings() {
  return (await getSystemSettings()).security.uploadSecurity;
}

export async function assertUploadBatchAllowed(files: File[]) {
  const settings = await getUploadSecuritySettings();
  if (!settings.enabled) return settings;

  if (!files.length) {
    throw new UploadSecurityError("file_required", "File is required.");
  }

  if (files.length > settings.maxFilesPerUpload) {
    throw new UploadSecurityError("too_many_files", `Maximum files per upload is ${settings.maxFilesPerUpload}.`, {
      count: files.length,
      limit: settings.maxFilesPerUpload,
    });
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const totalLimit = settings.maxTotalUploadSizeMb * 1024 * 1024;
  if (totalSize > totalLimit) {
    throw new UploadSecurityError("total_size_exceeded", `Maximum total upload size is ${settings.maxTotalUploadSizeMb}MB.`, {
      totalSize,
      limit: totalLimit,
    });
  }

  return settings;
}

export async function validateUploadFile(file: File) {
  const settings = await getUploadSecuritySettings();
  if (!settings.enabled) {
    return {
      buffer: Buffer.from(await file.arrayBuffer()),
      mimeType: normalizeMimeType(file.type) || "application/octet-stream",
      extension: getExtension(file.name),
    };
  }

  const maxSize = settings.maxFileSizeMb * 1024 * 1024;
  if (file.size > maxSize) {
    throw new UploadSecurityError("file_too_large", `File is too large. Maximum size is ${settings.maxFileSizeMb}MB.`, {
      size: file.size,
      limit: maxSize,
    });
  }

  const extension = getExtension(file.name);
  const mimeType = normalizeMimeType(file.type);
  if ((settings.blockSvg || settings.blockHtml) && DANGEROUS_EXTENSIONS.has(extension)) {
    throw new UploadSecurityError("extension_blocked", "File type is not allowed.", { extension });
  }
  if ((settings.blockSvg || settings.blockHtml) && DANGEROUS_MIME_TYPES.has(mimeType)) {
    throw new UploadSecurityError("mime_blocked", "File type is not allowed.", { mimeType });
  }

  const allowed = allowedMimeTypes(settings);
  if (!allowed.has(mimeType)) {
    throw new UploadSecurityError("mime_blocked", "File type is not allowed.", { mimeType });
  }

  const rule = findRule(mimeType, extension);
  if (!rule) {
    throw new UploadSecurityError("extension_blocked", "File extension is not allowed for this MIME type.", {
      mimeType,
      extension,
    });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (settings.requireMagicBytes && !rule.matches(buffer)) {
    throw new UploadSecurityError("magic_bytes_mismatch", "File content does not match the declared type.", {
      mimeType,
      extension,
    });
  }

  return { buffer, mimeType, extension };
}
