import { saveConversionGoal } from "@/features/admin/server/operations";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();
  const formData = await request.formData();
  const key = String(formData.get("key") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const targetType = String(formData.get("targetType") ?? "").trim();
  if (!key || !label || !targetType) {
    return respondError(request, {
      error: "goal_invalid",
      message: "Key, label và target type là bắt buộc.",
      location: ROUTES.ADMIN.ANALYTICS_GOALS,
    });
  }
  await saveConversionGoal({
    key,
    label,
    targetType,
    isActive: String(formData.get("isActive") ?? "on") === "on",
  });
  return respondSuccess(request, { location: ROUTES.ADMIN.ANALYTICS_GOALS, message: "Đã lưu conversion goal." });
}
