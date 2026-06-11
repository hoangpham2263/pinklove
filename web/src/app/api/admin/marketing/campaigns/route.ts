import { saveCampaign } from "@/features/admin/server/operations";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const landingPageId = String(formData.get("landingPageId") ?? "").trim();
  if (!name || !landingPageId) {
    return respondError(request, {
      error: "campaign_invalid",
      message: "Tên campaign và landing page là bắt buộc.",
      location: ROUTES.ADMIN.MARKETING_CAMPAIGNS,
    });
  }
  await saveCampaign({
    name,
    landingPageId,
    channel: String(formData.get("channel") ?? "organic"),
    status: String(formData.get("status") ?? "draft"),
    budget: Number(formData.get("budget") ?? 0),
  });
  return respondSuccess(request, { location: ROUTES.ADMIN.MARKETING_CAMPAIGNS, message: "Đã tạo campaign." });
}
