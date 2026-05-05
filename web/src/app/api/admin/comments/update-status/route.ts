import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { updateCommentStatus } from "@/features/comments/server/service";
import type { CommentStatus } from "@/features/comments/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const formData = await request.formData();
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "pending") as CommentStatus;
  const adminNote = String(formData.get("adminNote") ?? "");
  const location = String(formData.get("returnTo") ?? ROUTES.ADMIN.COMMENTS).trim() || ROUTES.ADMIN.COMMENTS;

  if (!id) {
    return respondError(request, {
      error: "missing_comment_id",
      message: "Thiếu bình luận cần cập nhật.",
      location,
    });
  }

  const updated = await updateCommentStatus(id, status, admin.id, adminNote);
  if (!updated) {
    return respondError(request, {
      status: 404,
      error: "comment_not_found",
      message: "Không tìm thấy bình luận.",
      location,
    });
  }

  return respondSuccess(request, {
    location,
    message: "Đã cập nhật bình luận.",
  });
}
