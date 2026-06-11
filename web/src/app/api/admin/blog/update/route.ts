import { requireAdmin } from "@/lib/auth";
import { updateBlogPost } from "@/features/blog/server/service";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const originalSlug = String(formData.get("originalSlug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "");
  const content = String(formData.get("content") ?? "");
  const coverImage = String(formData.get("coverImage") ?? "").trim();
  const status = String(formData.get("status") ?? "draft") as "draft" | "published";

  if (!originalSlug || !title || !slug || !categoryId) {
    return respondError(request, { error: "missing_fields", message: "Thiếu dữ liệu để lưu blog post.", location: `${ROUTES.ADMIN.BLOG_POSTS}?error=missing_fields` });
  }

  const post = await updateBlogPost(originalSlug, {
    title,
    slug,
    categoryId,
    excerpt,
    content,
    coverImage,
    status,
  });

  if (!post) {
    return respondError(request, { error: "not_found", message: "Không tìm thấy blog post.", location: `${ROUTES.ADMIN.BLOG_POSTS}?error=not_found` });
  }

  return respondSuccess(request, { location: ROUTES.ADMIN.BLOG_ENTRY(post.slug), message: "Đã lưu blog post." });
}
