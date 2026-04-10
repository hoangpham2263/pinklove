import { requireAdmin } from "@/lib/auth";
import { deleteProductCategory } from "@/features/products/server/service";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const slug = String(formData.get("slug") ?? "").trim();

  if (!slug) {
    return respondError(request, { error: "missing_slug", message: "Thiếu slug để xóa product category.", location: `${ROUTES.ADMIN.PRODUCT_CATEGORIES}?error=missing_slug` });
  }

  await deleteProductCategory(slug);
  return respondSuccess(request, { location: ROUTES.ADMIN.PRODUCT_CATEGORIES, message: "Đã xóa product category." });
}
