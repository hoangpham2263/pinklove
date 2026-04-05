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

 const items = await listMediaAssets();
 return NextResponse.json({ items });
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
