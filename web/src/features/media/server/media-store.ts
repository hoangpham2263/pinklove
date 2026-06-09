import { randomUUID } from"node:crypto";
import { promises as fs } from"node:fs";
import path from"node:path";

import { query, type DbExecutor } from"@/lib/database";
import type { MediaAsset } from"../types";

const UPLOAD_ROOT_DIR = path.join(process.cwd(),"public","uploads");
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const MEDIA_ASSET_SELECT = "id, url, file_name, original_name, mime_type, size_bytes, created_at";

type MediaAssetRow = {
 id:string;
 url:string;
 file_name:string;
 original_name:string;
 mime_type:string;
 size_bytes:string | number;
 created_at:Date | string;
};

function mapMediaAsset(row:MediaAssetRow): MediaAsset {
 const createdAt = row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString();
 return {
  id:row.id,
  url:row.url,
  fileName:row.file_name,
  originalName:row.original_name,
  mimeType:row.mime_type,
  sizeBytes:Number(row.size_bytes),
  createdAt,
 };
}

async function ensureUploadDir() {
 await fs.mkdir(UPLOAD_ROOT_DIR, { recursive:true });
}

function getUploadPathFromUrl(url:string): string | null {
 let pathname:string;
 try {
  pathname = new URL(url,"http://local").pathname;
 } catch {
  return null;
 }

 if (!pathname.startsWith("/uploads/")) return null;

 const relativeUploadPath = pathname.replace(/^\/uploads\/+/,"");
 const absolutePath = path.resolve(UPLOAD_ROOT_DIR, relativeUploadPath);
 const uploadRoot = path.resolve(UPLOAD_ROOT_DIR);

 if (absolutePath !== uploadRoot && !absolutePath.startsWith(`${uploadRoot}${path.sep}`)) {
  return null;
 }

 return absolutePath;
}

function getFileExtension(file:File): string {
 const fromName = path.extname(file.name).toLowerCase();
 if (fromName) return fromName;

 if (file.type ==="image/jpeg") return".jpg";
 if (file.type ==="image/png") return".png";
 if (file.type ==="image/webp") return".webp";
 if (file.type ==="image/gif") return".gif";
 return"";
}

export async function listMediaAssets(options:{ page?:number; limit?:number } = {}): Promise<MediaAsset[]> {
 const page = Number.isFinite(options.page) && options.page && options.page > 0 ? Math.floor(options.page) : 1;
 const limit = Number.isFinite(options.limit) && options.limit && options.limit > 0 ? Math.floor(options.limit) : undefined;
 const offset = (page - 1) * (limit ?? 0);
 const result = limit
  ? await query<MediaAssetRow>(
   `SELECT ${MEDIA_ASSET_SELECT}
    FROM media_assets
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2`,
   [limit, offset]
  )
  : await query<MediaAssetRow>(
   `SELECT ${MEDIA_ASSET_SELECT}
    FROM media_assets
    ORDER BY created_at DESC`
  );
 return result.rows.map(mapMediaAsset);
}

export async function countMediaAssets(): Promise<number> {
 const result = await query<{ total:string }>(`SELECT COUNT(*)::text AS total FROM media_assets`);
 return Number(result.rows[0]?.total ??"0");
}

export async function findMediaAssetByUrl(url:string, execute:DbExecutor = query): Promise<MediaAsset | null> {
 const result = await execute<MediaAssetRow>(
  `SELECT ${MEDIA_ASSET_SELECT}
   FROM media_assets
   WHERE url = $1
   LIMIT 1`,
  [url]
 );
 return result.rows[0] ? mapMediaAsset(result.rows[0]) : null;
}

export async function findMediaAssetByIdOrFileName(value:string): Promise<MediaAsset | null> {
 const result = await query<MediaAssetRow>(
  `SELECT ${MEDIA_ASSET_SELECT}
   FROM media_assets
   WHERE id = $1 OR file_name = $1
   LIMIT 1`,
  [value]
 );
 return result.rows[0] ? mapMediaAsset(result.rows[0]) : null;
}

export async function saveUploadedMedia(file:File): Promise<MediaAsset> {
 if (file.size > MAX_FILE_SIZE_BYTES) {
 throw new Error("File is too large. Maximum size is 20MB.");
 }

 await ensureUploadDir();

 const now = new Date();
 const year = String(now.getUTCFullYear());
 const month = String(now.getUTCMonth() + 1).padStart(2,"0");
 const targetDir = path.join(UPLOAD_ROOT_DIR, year, month);
 await fs.mkdir(targetDir, { recursive:true });

 const extension = getFileExtension(file);
 const safeFileName = `${Date.now()}-${randomUUID()}${extension}`;
 const absoluteTargetPath = path.join(targetDir, safeFileName);

 const arrayBuffer = await file.arrayBuffer();
 const buffer = Buffer.from(arrayBuffer);
 await fs.writeFile(absoluteTargetPath, buffer);

 const url = `/uploads/${year}/${month}/${safeFileName}`;
 const item:MediaAsset = {
 id:randomUUID(),
 url,
 fileName:safeFileName,
 originalName:file.name,
 mimeType:file.type,
 sizeBytes:file.size,
 createdAt:now.toISOString(),
 };

 try {
  await query(
   `INSERT INTO media_assets (id, url, file_name, original_name, mime_type, size_bytes, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)`,
   [item.id, item.url, item.fileName, item.originalName, item.mimeType, item.sizeBytes, item.createdAt]
  );
 } catch (error) {
  try {
   await fs.unlink(absoluteTargetPath);
  } catch {
   // Ignore cleanup failure and surface the database error.
  }
  throw error;
 }

 return item;
}

export async function deleteMediaAsset(id:string): Promise<boolean> {
 const deletedResult = await query<MediaAssetRow>(
  `DELETE FROM media_assets
   WHERE id = $1
   RETURNING ${MEDIA_ASSET_SELECT}`,
  [id]
 );
 const target = deletedResult.rows[0] ? mapMediaAsset(deletedResult.rows[0]) : null;
 if (!target) return false;

 const absolutePath = getUploadPathFromUrl(target.url);
 if (absolutePath) {
 try {
  await fs.unlink(absolutePath);
 } catch {
  // Keep deletion idempotent when the file was already removed.
  }
 }

 return true;
}
