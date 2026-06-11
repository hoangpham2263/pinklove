import {
  deleteMediaCollection,
  getMediaCollection,
  saveMediaCollection,
  type MediaCollectionTargetType,
} from "@/features/media/server/media-collections";
import { getProviderByUserId } from "@/features/providers/server/service";
import { assertWeddingSiteOwnership } from "@/features/wedding-planning/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

function getRedirectLocation(targetType: string, targetId: string) {
  if (targetType === "wedding_site") {
    return `${ROUTES.CUSTOMER.WEDDING_PLANNING}?site=${encodeURIComponent(targetId)}`;
  }
  if (targetType === "provider") {
    return ROUTES.PROVIDER.PORTFOLIO;
  }
  return ROUTES.ADMIN.MEDIA_COLLECTIONS;
}

async function canManageTarget(userId: string, targetType: string, targetId: string) {
  if (targetType === "wedding_site") {
    return assertWeddingSiteOwnership(userId, targetId);
  }

  if (targetType === "provider") {
    const provider = await getProviderByUserId(userId);
    return provider?.id === targetId;
  }

  return false;
}

export async function POST(request: Request) {
  const user = await requireUser();
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "save");
  const id = String(formData.get("id") ?? "").trim();
  const targetType = String(formData.get("targetType") ?? "").trim() as MediaCollectionTargetType;
  const targetId = String(formData.get("targetId") ?? "").trim();
  const location = getRedirectLocation(targetType, targetId);

  if (!targetType || !targetId || !(await canManageTarget(user.id, targetType, targetId))) {
    return respondError(request, {
      status: 403,
      error: "collection_target_forbidden",
      message: "Bạn không có quyền quản lý collection này.",
      location,
    });
  }

  if (id) {
    const existing = await getMediaCollection(id);
    if (!existing || existing.target_type !== targetType || existing.target_id !== targetId) {
      return respondError(request, {
        status: 403,
        error: "collection_forbidden",
        message: "Collection không thuộc target hiện tại.",
        location,
      });
    }
  }

  if (intent === "delete") {
    if (!id) {
      return respondError(request, {
        error: "collection_id_required",
        message: "Thiếu collection cần xóa.",
        location,
      });
    }
    await deleteMediaCollection(id);
    return respondSuccess(request, { location, message: "Đã xóa media collection." });
  }

  const name = String(formData.get("name") ?? "").trim();
  let mediaUrls: unknown;

  try {
    mediaUrls = JSON.parse(String(formData.get("mediaUrls") ?? "[]")) as unknown;
  } catch {
    mediaUrls = null;
  }

  if (!name || !Array.isArray(mediaUrls)) {
    return respondError(request, {
      error: "invalid_collection",
      message: "Tên và danh sách media không hợp lệ.",
      location,
    });
  }

  try {
    await saveMediaCollection({
      id: id || undefined,
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
      location,
    });
  }

  return respondSuccess(request, { location, message: "Đã lưu media collection." });
}
