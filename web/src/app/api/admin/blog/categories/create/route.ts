import { requireAdmin } from "@/lib/auth";
import { createBlogCategory } from "@/features/blog/server/service";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();

  if (!name || !slug) {
    return respondError(request, { error: "missing_fields", message: "Thiếu dữ liệu để tạo blog category.", location: `${ROUTES.ADMIN.BLOG_CATEGORIES}?error=missing_fields` });
  }

  try {
    const category = await createBlogCategory({ name, slug, status: "draft" });
    return respondSuccess(request, { location: ROUTES.ADMIN.BLOG_CATEGORY(category.slug), message: "Đã tạo blog category." });
  } catch {
    return respondError(request, { error: "create_failed", message: "Không thể tạo blog category.", location: `${ROUTES.ADMIN.BLOG_CATEGORIES}?error=create_failed` });
  }
}
