import { createProviderPromotionRequestForUser } from "@/features/ads/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireProvider(ROUTES.PROVIDER.LOGIN);

  try {
    await createProviderPromotionRequestForUser(user.id, await request.formData());
    return respondSuccess(request, { location: ROUTES.PROVIDER.PRIORITY, message: "Đã gửi yêu cầu ưu tiên hiển thị." });
  } catch {
    return respondError(request, { error: "priority_request_invalid", message: "Không thể gửi yêu cầu ưu tiên.", location: ROUTES.PROVIDER.PRIORITY });
  }
}
