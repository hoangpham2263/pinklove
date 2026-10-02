import { adminUpdateProviderApplication, type ProviderApplicationReviewStatus } from "@/features/provider-applications/server/service";
import { getCurrentUserFromRequest, isAdminRole } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const actor = await getCurrentUserFromRequest(request);
  if (!actor) {
    return respondError(request, { status: 401, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập admin.", location: ROUTES.ADMIN.LOGIN });
  }
  if (!isAdminRole(actor.role)) {
    return respondError(request, { status: 403, error: "FORBIDDEN", message: "Bạn không có quyền duyệt provider.", location: ROUTES.CUSTOMER.DASHBOARD });
  }

  const formData = await request.formData();
  const applicationId = String(formData.get("applicationId") ?? "").trim();
  const status = String(formData.get("status") ?? "pending_review").trim() as ProviderApplicationReviewStatus;
  const reviewNote = String(formData.get("reviewNote") ?? "");

  if (!applicationId) {
    return respondError(request, {
      error: "missing_application",
      message: "Thiếu hồ sơ provider cần cập nhật.",
      location: `${ROUTES.ADMIN.PROVIDER_APPLICATIONS}?error=missing_application`,
    });
  }

  try {
    await adminUpdateProviderApplication({
      actorUserId: actor.id,
      applicationId,
      status,
      reviewNote,
    });

    return respondSuccess(request, {
      location: ROUTES.ADMIN.PROVIDER_APPLICATIONS,
      message: status === "approved" ? "Đã duyệt và mở quyền provider." : "Đã cập nhật hồ sơ provider.",
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "update_failed";
    const message =
      code === "PROVIDER_APPLICATION_NOT_FOUND"
        ? "Không tìm thấy hồ sơ provider."
        : code === "PROVIDER_APPLICATION_STATUS_INVALID"
          ? "Trạng thái hồ sơ provider không hợp lệ."
          : code === "PROVIDER_APPLICATION_USER_NOT_FOUND"
            ? "Không tìm thấy account customer tương ứng để mở quyền provider."
            : "Không thể cập nhật hồ sơ provider lúc này.";

    return respondError(request, {
      error: code,
      message,
      location: `${ROUTES.ADMIN.PROVIDER_APPLICATIONS}?error=${encodeURIComponent(code)}`,
    });
  }
}
