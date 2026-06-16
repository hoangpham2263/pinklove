import { createProviderPromotionPlan } from "@/features/ads/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();
  try {
    await createProviderPromotionPlan(await request.formData());
    return respondSuccess(request, { location: ROUTES.ADMIN.MARKETING_PROVIDER_PRIORITY, message: "Đã lưu gói ưu tiên." });
  } catch {
    return respondError(request, { error: "provider_plan_invalid", message: "Key và tên gói là bắt buộc.", location: ROUTES.ADMIN.MARKETING_PROVIDER_PRIORITY });
  }
}
