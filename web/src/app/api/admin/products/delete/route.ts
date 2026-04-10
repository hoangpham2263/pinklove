import { requireAdmin } from "@/lib/auth";
import { deleteProduct } from "@/features/products/server/service";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const slug = String(formData.get("slug") ?? "").trim();

  if (!slug) {
    return respondError(request, { error: "missing_slug", message: "Thiếu slug sản phẩm để xóa.", location: `${ROUTES.ADMIN.PRODUCT_LIST}?error=missing_slug` });
  }

  await deleteProduct(slug);

  return respondSuccess(request, { location: ROUTES.ADMIN.PRODUCT_LIST, message: "Đã xóa sản phẩm." });
}
