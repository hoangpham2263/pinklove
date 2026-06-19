import { createAdvertiser } from "@/features/ads/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();
  try {
    const formData = await request.formData();
    const intent = String(formData.get("intent") ?? "create");
    await createAdvertiser(formData);
    return respondSuccess(request, { location: ROUTES.ADMIN.MARKETING_ADVERTISERS, message: intent === "archive" ? "Đã archive advertiser." : "Đã lưu advertiser." });
  } catch {
    return respondError(request, { error: "advertiser_invalid", message: "Tên advertiser là bắt buộc.", location: ROUTES.ADMIN.MARKETING_ADVERTISERS });
  }
}
