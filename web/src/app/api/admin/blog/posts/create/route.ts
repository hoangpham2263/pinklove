import { requireAdmin } from "@/lib/auth";
import { createBlogPost } from "@/features/blog/server/service";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();

  if (!title || !slug || !categoryId) {
    return respondError(request, { error: "missing_fields", message: "Thiếu dữ liệu để tạo blog post.", location: `${ROUTES.ADMIN.BLOG_POSTS}?error=missing_fields` });
  }

  try {
    const post = await createBlogPost({ title, slug, categoryId, status: "draft" });
    return respondSuccess(request, { location: ROUTES.ADMIN.BLOG_POST(post.slug), message: "Đã tạo blog post." });
  } catch {
    return respondError(request, { error: "create_failed", message: "Không thể tạo blog post.", location: `${ROUTES.ADMIN.BLOG_POSTS}?error=create_failed` });
  }
}
