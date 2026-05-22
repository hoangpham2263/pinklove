import { requireAdmin } from "@/lib/auth";
import { createOfferingCategory } from "@/features/offerings/server/service";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "");
  const status = String(formData.get("status") ?? "draft").trim() as "draft" | "published";

  if (!name || !slug) {
    return respondError(request, { error: "missing_fields", message: "Thiếu dữ liệu để tạo Offering Cat.", location: `${ROUTES.ADMIN.OFFERING_CATEGORIES}?error=missing_fields` });
  }

  try {
    const category = await createOfferingCategory({ name, slug, description, status });
    return respondSuccess(request, { location: ROUTES.ADMIN.OFFERING_CATEGORY(category.slug), message: "Đã tạo Offering Cat." });
  } catch {
    return respondError(request, { error: "create_failed", message: "Không thể tạo Offering Cat.", location: `${ROUTES.ADMIN.OFFERING_CATEGORIES}?error=create_failed` });
  }
}
