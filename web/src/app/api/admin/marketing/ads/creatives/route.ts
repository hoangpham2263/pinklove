import { createAdCreative } from "@/features/ads/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();
  try {
    const formData = await request.formData();
    const intent = String(formData.get("intent") ?? "create");
    await createAdCreative(formData);
    return respondSuccess(request, { location: ROUTES.ADMIN.MARKETING_AD_CREATIVES, message: intent === "archive" ? "Đã archive creative." : "Đã lưu creative." });
  } catch {
    return respondError(request, { error: "creative_invalid", message: "Tên creative và image URL là bắt buộc.", location: ROUTES.ADMIN.MARKETING_AD_CREATIVES });
  }
}
