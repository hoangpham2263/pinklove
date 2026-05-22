import { requireAdmin } from "@/lib/auth";
import { deleteOfferingCategory } from "@/features/offerings/server/service";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const slug = String(formData.get("slug") ?? "").trim();

  if (!slug) {
    return respondError(request, { error: "missing_slug", message: "Thiếu slug để xóa Offering Cat.", location: `${ROUTES.ADMIN.OFFERING_CATEGORIES}?error=missing_slug` });
  }

  await deleteOfferingCategory(slug);
  return respondSuccess(request, { location: ROUTES.ADMIN.OFFERING_CATEGORIES, message: "Đã xóa Offering Cat." });
}
