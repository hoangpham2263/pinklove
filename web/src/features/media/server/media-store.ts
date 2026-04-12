import { randomUUID } from"node:crypto";
import { promises as fs } from"node:fs";
import path from"node:path";

import type { MediaAsset } from"../types";

const UPLOAD_ROOT_DIR = path.join(process.cwd(),"public","uploads");
const STORE_DIR = path.join(process.cwd(),"storage");
const STORE_FILE = path.join(STORE_DIR,"media.json");
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

async function ensureMediaStore() {
 await fs.mkdir(UPLOAD_ROOT_DIR, { recursive:true });
 await fs.mkdir(STORE_DIR, { recursive:true });

 try {
 await fs.access(STORE_FILE);
 } catch {
 await fs.writeFile(STORE_FILE,"[]","utf8");
 }
}

async function readStore(): Promise<MediaAsset[]> {
 await ensureMediaStore();
 const raw = await fs.readFile(STORE_FILE,"utf8");
 const parsed = JSON.parse(raw) as MediaAsset[];
 return parsed.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function writeStore(items:MediaAsset[]) {
 await fs.writeFile(STORE_FILE, JSON.stringify(items, null, 2),"utf8");
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

export async function listMediaAssets(): Promise<MediaAsset[]> {
 return readStore();
}

export async function findMediaAssetByUrl(url:string): Promise<MediaAsset | null> {
 const items = await readStore();
 return items.find((item) => item.url === url) ?? null;
}

export async function saveUploadedMedia(file:File): Promise<MediaAsset> {
 if (file.size > MAX_FILE_SIZE_BYTES) {
 throw new Error("File is too large. Maximum size is 20MB.");
 }

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

 const items = await readStore();
 await writeStore([item, ...items]);
 return item;
}

export async function deleteMediaAsset(id:string): Promise<boolean> {
 const items = await readStore();
 const target = items.find((item) => item.id === id);
 if (!target) return false;

 if (target.url.startsWith("/uploads/")) {
 const relativePath = target.url.replace(/^\/+/,"");
 const absolutePath = path.join(process.cwd(),"public", relativePath);
 try {
  await fs.unlink(absolutePath);
 } catch {
  // Ignore missing files
 }
 }

 const nextItems = items.filter((item) => item.id !== id);
 await writeStore(nextItems);
 return true;
}
