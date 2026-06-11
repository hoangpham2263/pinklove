import { deleteAdminRole } from "@/features/access/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export async function POST(request: Request) {
  const actor = await getCurrentUserFromRequest(request);
  if (!actor) return respondError(request, { status: 403, error: "forbidden", message: "Không có quyền." });
  const form = await request.formData();
  try {
    await deleteAdminRole(String(form.get("id") ?? ""), actor.id);
    return respondSuccess(request, { location: ROUTES.ADMIN.ACCESS_ROLES, message: "Đã xóa Admin role." });
  } catch (error) {
    const message = error instanceof Error && error.message === "ROLE_IN_USE"
      ? "Role đang được gán cho tài khoản."
      : "Không thể xóa Admin role.";
    return respondError(request, { error: "delete_failed", message });
  }
}
