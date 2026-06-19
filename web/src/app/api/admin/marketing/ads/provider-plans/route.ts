import { createProviderPromotionPlan } from "@/features/ads/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();
  try {
    const formData = await request.formData();
    const intent = String(formData.get("intent") ?? "create");
    await createProviderPromotionPlan(formData);
    return respondSuccess(request, { location: ROUTES.ADMIN.MARKETING_PROVIDER_PRIORITY, message: intent === "archive" ? "Đã tắt gói ưu tiên." : "Đã lưu gói ưu tiên." });
  } catch {
    return respondError(request, { error: "provider_plan_invalid", message: "Key và tên gói là bắt buộc.", location: ROUTES.ADMIN.MARKETING_PROVIDER_PRIORITY });
  }
}
