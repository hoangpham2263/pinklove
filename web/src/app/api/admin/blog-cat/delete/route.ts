import { requireAdmin } from "@/lib/auth";
import { deleteBlogCategory } from "@/features/blog/server/service";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const slug = String(formData.get("slug") ?? "").trim();

  if (!slug) {
    return respondError(request, { error: "missing_slug", message: "Thiếu slug để xóa blog category.", location: `${ROUTES.ADMIN.BLOG_CATEGORIES}?error=missing_slug` });
  }

  await deleteBlogCategory(slug);
  return respondSuccess(request, { location: ROUTES.ADMIN.BLOG_CATEGORIES, message: "Đã xóa blog category." });
}
