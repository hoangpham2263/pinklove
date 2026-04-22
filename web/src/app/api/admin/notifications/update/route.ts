import { respondError, respondSuccess } from "@/lib/action-response";
import { updateAdminNotification } from "@/features/notifications/server/service";
import { requireAdmin } from "@/lib/auth";
import { parseUserRole, type UserRole } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();
  const formData = await request.formData();
  const notificationId = String(formData.get("id") ?? "").trim();
  const audienceTypeInput = String(formData.get("audienceType") ?? "all");
  const audienceType = audienceTypeInput === "role" || audienceTypeInput === "users" ? audienceTypeInput : "all";
  const sendModeInput = String(formData.get("sendMode") ?? "now");
  const sendMode = sendModeInput === "draft" || sendModeInput === "scheduled" ? sendModeInput : "now";
  const roles = formData.getAll("roles").map((role) => parseUserRole(String(role))) as UserRole[];
  const userIds = formData.getAll("userIds").map((id) => String(id)).filter(Boolean);

  if (!notificationId) {
    return respondError(request, {
      error: "missing_notification_id",
      message: "Thiếu mã thông báo để cập nhật.",
      location: `${ROUTES.ADMIN.NOTIFICATIONS}?error=missing_notification_id`,
    });
  }

  try {
    const updated = await updateAdminNotification(notificationId, {
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? ""),
      linkUrl: String(formData.get("linkUrl") ?? ""),
      scheduledAt: String(formData.get("scheduledAt") ?? ""),
      sendMode,
      audienceType,
      roles,
      userIds,
    });

    if (!updated) {
      return respondError(request, {
        error: "notification_not_found",
        message: "Không tìm thấy thông báo để cập nhật.",
        location: `${ROUTES.ADMIN.NOTIFICATIONS}?error=notification_not_found`,
        status: 404,
      });
    }

    return respondSuccess(request, {
      location: ROUTES.ADMIN.NOTIFICATIONS,
      message: "Đã cập nhật thông báo.",
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "MISSING_TITLE"
        ? "Hãy nhập tiêu đề thông báo."
        : error instanceof Error && error.message === "MISSING_ROLES"
          ? "Hãy chọn ít nhất một role."
          : error instanceof Error && error.message === "MISSING_USERS"
            ? "Hãy chọn ít nhất một tài khoản."
            : "Không thể cập nhật thông báo.";

    return respondError(request, {
      error: "notification_update_failed",
      message,
      location: `${ROUTES.ADMIN.NOTIFICATIONS}?error=notification_update_failed`,
    });
  }
}
