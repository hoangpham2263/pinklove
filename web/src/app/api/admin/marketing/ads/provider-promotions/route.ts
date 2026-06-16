import { createProviderPromotion } from "@/features/ads/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();
  try {
    await createProviderPromotion(await request.formData());
    return respondSuccess(request, { location: ROUTES.ADMIN.MARKETING_PROVIDER_PRIORITY, message: "Đã tạo ưu tiên provider." });
  } catch {
    return respondError(request, { error: "provider_promotion_invalid", message: "Provider và tiêu đề ưu tiên là bắt buộc.", location: ROUTES.ADMIN.MARKETING_PROVIDER_PRIORITY });
  }
}
