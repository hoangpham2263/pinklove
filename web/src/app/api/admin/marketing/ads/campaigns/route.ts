import { createAdCampaign } from "@/features/ads/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();
  try {
    await createAdCampaign(await request.formData());
    return respondSuccess(request, { location: ROUTES.ADMIN.MARKETING_BANNER_ADS, message: "Đã tạo banner ad." });
  } catch {
    return respondError(request, { error: "ad_campaign_invalid", message: "Tên campaign, advertiser và placement là bắt buộc.", location: ROUTES.ADMIN.MARKETING_BANNER_ADS });
  }
}
