import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { updateGlobalFields } from "@/lib/global-fields";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return respondError(request, {
      status: 401,
      error: "UNAUTHORIZED",
      message: "Vui lòng đăng nhập admin.",
      location: ROUTES.ADMIN.LOGIN,
    });
  }

  const formData = await request.formData();
  const rawValues = String(formData.get("values") ?? "{}");

  let values: Record<string, unknown> = {};

  try {
    values = JSON.parse(rawValues) as Record<string, unknown>;
  } catch {
    return respondError(request, {
      error: "invalid_payload",
      message: "Dữ liệu Global Fields không hợp lệ.",
      location: ROUTES.ADMIN.GLOBAL_FIELDS,
    });
  }

  try {
    await updateGlobalFields(values);

    return respondSuccess(request, {
      message: "Đã lưu Global Fields.",
      location: ROUTES.ADMIN.GLOBAL_FIELDS,
    });
  } catch (error) {
    console.error("Failed to update global fields:", error);
    return respondError(request, {
      error: "update_failed",
      message: "Không thể lưu Global Fields.",
      location: ROUTES.ADMIN.GLOBAL_FIELDS,
    });
  }
}
