import {
  deleteMediaCollection,
  listMediaCollections,
  saveMediaCollection,
} from "@/features/media/server/media-collections";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function GET() {
  await requireAdmin();
  const collections = await listMediaCollections();
  return Response.json({ collections });
}

export async function POST(request: Request) {
  await requireAdmin();
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "save");

  if (intent === "delete") {
    const id = String(formData.get("id") ?? "").trim();
    if (!id) {
      return respondError(request, {
        error: "collection_id_required",
        message: "Thiếu collection cần xóa.",
        location: ROUTES.ADMIN.MEDIA_COLLECTIONS,
      });
    }
    await deleteMediaCollection(id);
    return respondSuccess(request, { location: ROUTES.ADMIN.MEDIA_COLLECTIONS, message: "Đã xóa media collection." });
  }

  const name = String(formData.get("name") ?? "").trim();
  const targetType = String(formData.get("targetType") ?? "").trim();
  const targetId = String(formData.get("targetId") ?? "").trim();
  let mediaUrls: unknown;

  try {
    mediaUrls = JSON.parse(String(formData.get("mediaUrls") ?? "[]")) as unknown;
  } catch {
    mediaUrls = null;
  }

  if (!name || !targetType || !targetId || !Array.isArray(mediaUrls)) {
    return respondError(request, {
      error: "invalid_collection",
      message: "Tên, target và danh sách media không hợp lệ.",
      location: ROUTES.ADMIN.MEDIA_COLLECTIONS,
    });
  }

  try {
    await saveMediaCollection({
      id: String(formData.get("id") ?? "").trim() || undefined,
      name,
      targetType,
      targetId,
      description: String(formData.get("description") ?? ""),
      mediaUrls: mediaUrls.map(String),
    });
  } catch (error) {
    console.error("Failed to save media collection", error);
    return respondError(request, {
      status: 500,
      error: "collection_save_failed",
      message: "Không thể lưu media collection.",
      location: ROUTES.ADMIN.MEDIA_COLLECTIONS,
    });
  }

  return respondSuccess(request, { location: ROUTES.ADMIN.MEDIA_COLLECTIONS, message: "Đã lưu media collection." });
}
