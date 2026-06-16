import { createAdPlacement } from "@/features/ads/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();
  try {
    await createAdPlacement(await request.formData());
    return respondSuccess(request, { location: ROUTES.ADMIN.MARKETING_AD_PLACEMENTS, message: "Đã lưu placement." });
  } catch {
    return respondError(request, { error: "placement_invalid", message: "Key và tên placement là bắt buộc.", location: ROUTES.ADMIN.MARKETING_AD_PLACEMENTS });
  }
}
