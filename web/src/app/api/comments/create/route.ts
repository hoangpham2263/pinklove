import { getCurrentUserFromRequest } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { createPendingComment, parseCommentTargetFromForm } from "@/features/comments/server/service";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

function hasUploadedFile(formData: FormData, fieldName: string) {
  return formData.getAll(fieldName).some((value) => {
    if (typeof value === "string") {
      return false;
    }

    return typeof value.size === "number" && value.size > 0;
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  const formData = await request.formData();
  const returnTo = String(formData.get("returnTo") ?? "/").trim() || "/";
  const honeypot = String(formData.get("website") ?? "").trim();

  if (honeypot) {
    return respondSuccess(request, {
      location: returnTo,
      message: "Nội dung đang chờ duyệt.",
    });
  }

  try {
    const targetType = String(formData.get("targetType") ?? "");

    if (targetType === "offering" && !user) {
      return respondError(request, {
        error: "login_required",
        message: "Bạn cần đăng nhập để viết đánh giá.",
        location: `${ROUTES.AUTH.LOGIN}?returnTo=${encodeURIComponent(returnTo)}`,
      });
    }

    await createPendingComment({
      target: parseCommentTargetFromForm(formData),
      authorName: String(formData.get("authorName") ?? user?.accountName ?? ""),
      authorEmail: String(formData.get("authorEmail") ?? ""),
      authorUserId: user?.id ?? null,
      content: String(formData.get("content") ?? ""),
      rating: Number(formData.get("rating") ?? 5),
      hasImage: String(formData.get("hasImage") ?? "") === "1" || hasUploadedFile(formData, "reviewImages"),
      hasVideo: String(formData.get("hasVideo") ?? "") === "1" || hasUploadedFile(formData, "reviewVideos"),
    });

    return respondSuccess(request, {
      location: returnTo,
      message: targetType === "offering" ? "Đánh giá đang chờ admin duyệt." : "Bình luận đang chờ admin duyệt.",
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "MISSING_AUTHOR_NAME"
        ? "Hãy nhập tên hiển thị."
        : error instanceof Error && error.message === "MISSING_CONTENT"
          ? "Hãy nhập nội dung."
          : "Không thể gửi nội dung.";

    return respondError(request, {
      error: "comment_create_failed",
      message,
      location: returnTo,
    });
  }
}
