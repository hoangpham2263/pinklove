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
  const excerpt = String(formData.get("excerpt") ?? "");
  const content = String(formData.get("content") ?? "");
  const coverImage = String(formData.get("coverImage") ?? "").trim();
  const status = String(formData.get("status") ?? "draft") as "draft" | "published";

  if (!title || !slug || !categoryId) {
    return respondError(request, { error: "missing_fields", message: "Thiếu dữ liệu để tạo blog post.", location: `${ROUTES.ADMIN.BLOG}?error=missing_fields` });
  }

  try {
    const post = await createBlogPost({ title, slug, categoryId, excerpt, content, coverImage, status });
    return respondSuccess(request, { location: ROUTES.ADMIN.BLOG_ENTRY(post.slug), message: "Đã tạo blog post." });
  } catch {
    return respondError(request, { error: "create_failed", message: "Không thể tạo blog post.", location: `${ROUTES.ADMIN.BLOG}?error=create_failed` });
  }
}
