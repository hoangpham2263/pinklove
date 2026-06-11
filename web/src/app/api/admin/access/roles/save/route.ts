import { saveAdminRole } from "@/features/access/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export async function POST(request: Request) {
  const actor = await getCurrentUserFromRequest(request);
  if (!actor) return respondError(request, { status: 403, error: "forbidden", message: "Không có quyền." });
  const form = await request.formData();
  try {
    const roleId = await saveAdminRole({
      id: String(form.get("id") ?? ""),
      key: String(form.get("key") ?? ""),
      label: String(form.get("label") ?? ""),
      description: String(form.get("description") ?? ""),
      isActive: String(form.get("status") ?? "active") === "active",
      permissionIds: form.getAll("permissionIds").map(String),
      actorId: actor.id,
    });
    return respondSuccess(request, {
      location: ROUTES.ADMIN.ACCESS_ROLE(roleId),
      message: "Đã lưu Admin role.",
    });
  } catch {
    return respondError(request, { error: "save_failed", message: "Không thể lưu Admin role." });
  }
}
