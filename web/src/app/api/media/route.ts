import { NextResponse } from"next/server";

import {
 deleteMediaAsset,
 listMediaAssets,
 saveUploadedMedia,
} from"@/features/media/server/media-store";
import { getCurrentUserFromRequest } from"@/lib/auth";

export const runtime ="nodejs";
export const dynamic ="force-dynamic";

export async function GET(request: Request) {
 const user = await getCurrentUserFromRequest(request);
 if (!user) {
 return NextResponse.json({ message:"Unauthorized" }, { status: 401 });
 }

 const { searchParams } = new URL(request.url);
 const pageParam = Number(searchParams.get("page") ?? "1");
 const limitParam = Number(searchParams.get("limit") ?? "100");
 const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
 const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.floor(limitParam) : 100;

 const items = await listMediaAssets();
 const total = items.length;
 const totalPages = Math.max(1, Math.ceil(total / limit));
 const normalizedPage = Math.min(page, totalPages);
 const offset = (normalizedPage - 1) * limit;
 const pagedItems = items.slice(offset, offset + limit);

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
