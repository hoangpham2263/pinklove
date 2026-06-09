import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { ROUTES } from "@/lib/routes";
import { deleteLandingPage } from "@/features/landing-pages/server/service";

export const runtime = "nodejs";

function withQuery(path: string, key: string, value: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${encodeURIComponent(value)}`;
}

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const landingPageId = String(formData.get("landingPageId") ?? "").trim();
  const location = ROUTES.ADMIN.LANDING_PAGES;

  if (!landingPageId) {
    return respondError(request, {
      error: "missing_fields",
      message: "Thiếu landing để xóa.",
      location: withQuery(location, "error", "missing_fields"),
    });
  }

  const deleted = await deleteLandingPage(landingPageId);

  if (!deleted) {
    return respondError(request, {
      error: "landing_page_not_found",
      message: "Không tìm thấy landing.",
      location: withQuery(location, "error", "landing_page_not_found"),
    });
  }

  return respondSuccess(request, {
    location: withQuery(location, "deleted", "landingPage"),
    message: "Đã xóa landing page.",
  });
}
