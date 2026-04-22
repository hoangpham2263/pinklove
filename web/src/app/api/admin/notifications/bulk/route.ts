import { requireAdmin } from "@/lib/auth";
import {
  deleteAdminNotifications,
  updateAdminNotificationsStatus,
} from "@/features/notifications/server/service";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

type BulkAction = "draft" | "sent" | "archived" | "delete";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const action = String(formData.get("bulkAction") ?? "").trim() as BulkAction;
  const returnTo = String(formData.get("returnTo") ?? "").trim() || ROUTES.ADMIN.NOTIFICATIONS;
  const ids = formData
    .getAll("ids")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (ids.length === 0) {
    return respondError(request, {
      error: "missing_selection",
      message: "Hãy chọn ít nhất một thông báo.",
      location: `${returnTo}?error=missing_selection`,
    });
  }

  if (!["draft", "sent", "archived", "delete"].includes(action)) {
    return respondError(request, {
      error: "invalid_bulk_action",
      message: "Tác vụ hàng loạt không hợp lệ.",
      location: `${returnTo}?error=invalid_bulk_action`,
    });
  }

  if (action === "delete") {
    const count = await deleteAdminNotifications(ids);
    return respondSuccess(request, {
      location: returnTo,
      message: `${count} thông báo đã bị xóa.`,
      data: { count, bulk: "deleted" },
    });
  }

  const count = await updateAdminNotificationsStatus(ids, action);
  const statusLabel = action === "sent" ? "Đã gửi" : action === "archived" ? "Lưu trữ" : "Bản nháp";
  return respondSuccess(request, {
    location: returnTo,
    message: `${count} thông báo đã chuyển sang ${statusLabel}.`,
    data: { count, bulk: action },
  });
}
