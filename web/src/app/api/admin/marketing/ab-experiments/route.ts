import { saveAbExperiment } from "@/features/admin/server/operations";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return respondError(request, {
      error: "experiment_invalid",
      message: "Tên A/B test là bắt buộc.",
      location: ROUTES.ADMIN.AB_EXPERIMENTS,
    });
  }
  await saveAbExperiment({
    name,
    status: String(formData.get("status") ?? "draft"),
    primaryMetric: String(formData.get("primaryMetric") ?? "orders"),
    landingPageId: String(formData.get("landingPageId") ?? "").trim() || undefined,
    trafficPercent: Number(formData.get("trafficPercent") ?? 100),
  });
  return respondSuccess(request, { location: ROUTES.ADMIN.AB_EXPERIMENTS, message: "Đã tạo A/B test." });
}
