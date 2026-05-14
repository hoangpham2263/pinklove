import { requireAdmin } from "@/lib/auth";
import { deleteBlogPost } from "@/features/blog/server/service";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const slug = String(formData.get("slug") ?? "").trim();

  if (!slug) {
    return respondError(request, { error: "missing_slug", message: "Thiếu slug để xóa blog post.", location: `${ROUTES.ADMIN.BLOG}?error=missing_slug` });
  }

  await deleteBlogPost(slug);
  return respondSuccess(request, { location: ROUTES.ADMIN.BLOG, message: "Đã xóa blog post." });
}
