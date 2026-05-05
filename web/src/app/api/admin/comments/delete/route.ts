import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { softDeleteComment } from "@/features/comments/server/service";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();
  const formData = await request.formData();
  const id = String(formData.get("id") ?? "").trim();
  const location = String(formData.get("returnTo") ?? ROUTES.ADMIN.COMMENTS).trim() || ROUTES.ADMIN.COMMENTS;

  if (!id) {
    return respondError(request, {
      error: "missing_comment_id",
      message: "Thiếu bình luận cần xóa.",
      location,
    });
  }

  const deleted = await softDeleteComment(id);
  if (!deleted) {
    return respondError(request, {
      status: 404,
      error: "comment_not_found",
      message: "Không tìm thấy bình luận.",
      location,
    });
  }

  return respondSuccess(request, {
    location,
    message: "Đã xóa bình luận.",
  });
}
