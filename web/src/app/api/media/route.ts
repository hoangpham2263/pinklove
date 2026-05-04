import { NextResponse } from"next/server";

import {
 countMediaAssets,
 deleteMediaAsset,
 findMediaAssetByUrl,
 listMediaAssets,
 saveUploadedMedia,
} from"@/features/media/server/media-store";
import { getCurrentUserFromRequest } from"@/lib/auth";

export const runtime ="nodejs";
export const dynamic ="force-dynamic";

const DEFAULT_MEDIA_LIMIT = 100;
const MAX_MEDIA_LIMIT = 200;

function normalizePositiveInteger(value:string | null, fallback:number) {
 const parsed = Number(value ?? String(fallback));
 return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export async function GET(request: Request) {
 const user = await getCurrentUserFromRequest(request);
 if (!user) {
 return NextResponse.json({ message:"Unauthorized" }, { status: 401 });
 }

 const { searchParams } = new URL(request.url);
 const url = searchParams.get("url");
 const page = normalizePositiveInteger(searchParams.get("page"), 1);
 const requestedLimit = normalizePositiveInteger(searchParams.get("limit"), DEFAULT_MEDIA_LIMIT);
 const limit = Math.min(requestedLimit, MAX_MEDIA_LIMIT);

 if (url) {
 const item = await findMediaAssetByUrl(url);
 return NextResponse.json({ item });
 }

 const total = await countMediaAssets();
 const totalPages = Math.max(1, Math.ceil(total / limit));
 const normalizedPage = Math.min(page, totalPages);
 const pagedItems = await listMediaAssets({ page:normalizedPage, limit });

 return NextResponse.json({ items: pagedItems, total, page: normalizedPage, limit });
}

export async function POST(request: Request) {
 const user = await getCurrentUserFromRequest(request);
 if (!user) {
 return NextResponse.json({ message:"Unauthorized" }, { status: 401 });
 }

 const formData = await request.formData();
 const file = formData.get("file");

 if (!(file instanceof File)) {
 return NextResponse.json({ message:"File is required." }, { status: 400 });
 }

 try {
 const item = await saveUploadedMedia(file);
 return NextResponse.json({ item }, { status: 201 });
 } catch (error) {
 const message =
  error instanceof Error ? error.message :"Failed to upload media.";
 return NextResponse.json({ message }, { status: 400 });
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
