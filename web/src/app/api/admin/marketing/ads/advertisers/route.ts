import { createAdvertiser } from "@/features/ads/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();
  try {
    await createAdvertiser(await request.formData());
    return respondSuccess(request, { location: ROUTES.ADMIN.MARKETING_ADVERTISERS, message: "Đã tạo advertiser." });
  } catch {
    return respondError(request, { error: "advertiser_invalid", message: "Tên advertiser là bắt buộc.", location: ROUTES.ADMIN.MARKETING_ADVERTISERS });
  }
}
