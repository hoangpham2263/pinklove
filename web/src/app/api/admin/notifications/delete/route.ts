import { requireAdmin } from "@/lib/auth";
import { deleteAdminNotification } from "@/features/notifications/server/service";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const notificationId = String(formData.get("id") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "").trim() || ROUTES.ADMIN.NOTIFICATIONS;

  if (!notificationId) {
    return respondError(request, {
      error: "missing_notification_id",
      message: "Thiếu mã thông báo để xóa.",
      location: `${returnTo}?error=missing_notification_id`,
    });
  }

  await deleteAdminNotification(notificationId);

  return respondSuccess(request, { location: returnTo, message: "Đã xóa thông báo." });
}
