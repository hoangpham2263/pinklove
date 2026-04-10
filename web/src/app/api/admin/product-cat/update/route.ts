import { requireAdmin } from "@/lib/auth";
import { updateProductCategory } from "@/features/products/server/service";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const originalSlug = String(formData.get("originalSlug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "");
  const status = String(formData.get("status") ?? "draft") as "draft" | "published";

  if (!originalSlug || !name || !slug) {
    return respondError(request, { error: "missing_fields", message: "Thiếu dữ liệu để lưu Product Cat.", location: `${ROUTES.ADMIN.PRODUCT_CATEGORIES}?error=missing_fields` });
  }

  const category = await updateProductCategory(originalSlug, { name, slug, description, status });
  if (!category) {
    return respondError(request, { error: "not_found", message: "Không tìm thấy Product Cat.", location: `${ROUTES.ADMIN.PRODUCT_CATEGORIES}?error=not_found` });
  }

  return respondSuccess(request, { location: ROUTES.ADMIN.PRODUCT_CATEGORY(category.slug), message: "Đã lưu Product Cat." });
}
