import { getCurrentUserFromRequest } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { createPendingComment, parseCommentTargetFromForm } from "@/features/comments/server/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  const formData = await request.formData();
  const returnTo = String(formData.get("returnTo") ?? "/").trim() || "/";
  const honeypot = String(formData.get("website") ?? "").trim();

  if (honeypot) {
    return respondSuccess(request, {
      location: returnTo,
      message: "Bình luận đang chờ duyệt.",
    });
  }

  try {
    await createPendingComment({
      target: parseCommentTargetFromForm(formData),
      authorName: String(formData.get("authorName") ?? ""),
      authorEmail: String(formData.get("authorEmail") ?? ""),
      authorUserId: user?.id ?? null,
      content: String(formData.get("content") ?? ""),
    });

    return respondSuccess(request, {
      location: returnTo,
      message: "Bình luận đang chờ admin duyệt.",
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "MISSING_AUTHOR_NAME"
        ? "Hãy nhập tên hiển thị."
        : error instanceof Error && error.message === "MISSING_CONTENT"
          ? "Hãy nhập nội dung bình luận."
          : "Không thể gửi bình luận.";

    return respondError(request, {
      error: "comment_create_failed",
      message,
      location: returnTo,
    });
  }
}
