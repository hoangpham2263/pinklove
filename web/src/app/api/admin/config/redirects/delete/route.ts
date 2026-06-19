import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { ROUTES } from "@/lib/routes";
import { deleteSeoRedirectRule } from "@/lib/seo-redirects";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();
  const id = String((await request.formData()).get("id") ?? "").trim();
  if (!id) {
    return respondError(request, { status: 400, error: "MISSING_ID", message: "Thiếu redirect id." });
  }
  await deleteSeoRedirectRule(id);
  return respondSuccess(request, { location: ROUTES.ADMIN.CONFIG_SEO_REDIRECTS, message: "Đã xóa redirect." });
}
