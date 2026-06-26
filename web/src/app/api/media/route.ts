import { NextResponse } from"next/server";

import {
 countMediaAssets,
 deleteMediaAsset,
 findMediaAssetByUrl,
 listMediaAssets,
 saveUploadedMedia,
} from"@/features/media/server/media-store";
import { getCurrentUserFromRequest } from"@/lib/auth";
import {
 endpointProtectionResponse,
 enforceEndpointProtection,
 getEndpointPageSizeLimit,
 recordSlowEndpoint,
} from "@/lib/endpoint-protection";
import { recordSecurityEvent } from "@/lib/security-events";
import { assertUploadBatchAllowed, UploadSecurityError } from "@/lib/upload-security";

export const runtime ="nodejs";
export const dynamic ="force-dynamic";

const DEFAULT_MEDIA_LIMIT = 100;
const MAX_MEDIA_LIMIT = 200;

function normalizePositiveInteger(value:string | null, fallback:number) {
 const parsed = Number(value ?? String(fallback));
 return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export async function GET(request: Request) {
 const startedAt = Date.now();
 const user = await getCurrentUserFromRequest(request);
 if (!user) {
 return NextResponse.json({ message:"Unauthorized" }, { status: 401 });
 }

 const decision = await enforceEndpointProtection({
  request,
  endpointKey: "media:list",
  userId: user.id,
 });
 if (!decision.allowed) return endpointProtectionResponse(decision);

 const { searchParams } = new URL(request.url);
 const url = searchParams.get("url");
 const page = normalizePositiveInteger(searchParams.get("page"), 1);
 const requestedLimit = normalizePositiveInteger(searchParams.get("limit"), DEFAULT_MEDIA_LIMIT);
 const configuredLimit = await getEndpointPageSizeLimit();
 const limit = Math.min(requestedLimit, MAX_MEDIA_LIMIT, configuredLimit);

 if (url) {
 const item = await findMediaAssetByUrl(url);
 const response = NextResponse.json({ item });
 await recordSlowEndpoint({ request, endpointKey: "media:list", durationMs: Date.now() - startedAt, status: response.status, userId: user.id });
 return response;
 }

 const total = await countMediaAssets();
 const totalPages = Math.max(1, Math.ceil(total / limit));
 const normalizedPage = Math.min(page, totalPages);
 const pagedItems = await listMediaAssets({ page:normalizedPage, limit });

 const response = NextResponse.json({ items: pagedItems, total, page: normalizedPage, limit });
 await recordSlowEndpoint({ request, endpointKey: "media:list", durationMs: Date.now() - startedAt, status: response.status, userId: user.id });
 return response;
}

export async function POST(request: Request) {
 const startedAt = Date.now();
 const user = await getCurrentUserFromRequest(request);
 if (!user) {
 return NextResponse.json({ message:"Unauthorized" }, { status: 401 });
 }

 const decision = await enforceEndpointProtection({
  request,
  endpointKey: "media:upload",
  userId: user.id,
 });
 if (!decision.allowed) return endpointProtectionResponse(decision);

 const formData = await request.formData();
 const file = formData.get("file");

 if (!(file instanceof File)) {
 return NextResponse.json({ message:"File is required." }, { status: 400 });
 }

 try {
 const files = [file];
 await assertUploadBatchAllowed(files);
 const item = await saveUploadedMedia(file);
 const response = NextResponse.json({ item }, { status: 201 });
 await recordSlowEndpoint({ request, endpointKey: "media:upload", durationMs: Date.now() - startedAt, status: response.status, userId: user.id });
 return response;
 } catch (error) {
 if (error instanceof UploadSecurityError) {
  await recordSecurityEvent({
   request,
   eventType: "upload_rejected",
   severity: "warn",
   status: 400,
   userId: user.id,
   metadata: {
    reason: error.reason,
    fileNameLength: file.name.length,
    fileSize: file.size,
    fileType: file.type,
    ...error.metadata,
   },
  }).catch(() => undefined);

  const response = NextResponse.json({ message: error.message, reason: error.reason }, { status: 400 });
  await recordSlowEndpoint({ request, endpointKey: "media:upload", durationMs: Date.now() - startedAt, status: response.status, userId: user.id });
  return response;
 }

 const response = NextResponse.json({ message:"Failed to upload media." }, { status: 400 });
 await recordSlowEndpoint({ request, endpointKey: "media:upload", durationMs: Date.now() - startedAt, status: response.status, userId: user.id });
 return response;
 }
}

export async function DELETE(request: Request) {
 const user = await getCurrentUserFromRequest(request);
 if (!user) {
 return NextResponse.json({ message:"Unauthorized" }, { status: 401 });
 }

 const { searchParams } = new URL(request.url);
 const id = searchParams.get("id");

 if (!id) {
 return NextResponse.json({ message:"Media id is required." }, { status: 400 });
 }

 const deleted = await deleteMediaAsset(id);
 if (!deleted) {
 return NextResponse.json({ message:"Media not found." }, { status: 404 });
 }

 return NextResponse.json({ ok: true });
}
