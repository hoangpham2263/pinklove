import { requireAdmin } from "@/lib/auth";
import { updateManagedPage, getPageBySlug } from "@/lib/managed-pages";
import { canCustomizePagePermalink, isReservedPagePermalink, normalizePagePermalinkInput } from "@/lib/page-paths";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return respondError(request, { status: 401, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập admin.", location: ROUTES.ADMIN.LOGIN });
  }

  const formData = await request.formData();
  const originalSlug = String(formData.get("originalSlug") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const name = String(formData.get("name") ?? "");
  const title = String(formData.get("title") ?? "");
  const excerpt = String(formData.get("excerpt") ?? "");
  const body = String(formData.get("body") ?? "");
  const status = String(formData.get("status") ?? "draft");
  
  const seoTitle = String(formData.get("seoTitle") ?? "");
  const seoDescription = String(formData.get("seoDescription") ?? "");
  const seoKeywords = String(formData.get("seoKeywords") ?? "");
  const canonicalUrl = String(formData.get("canonicalUrl") ?? "");
  const permalink = String(formData.get("permalink") ?? "");
  const breadcrumbTitle = String(formData.get("breadcrumbTitle") ?? "");
  const breadcrumbParentSlug = String(formData.get("breadcrumbParentSlug") ?? "");
  const ogTitle = String(formData.get("ogTitle") ?? "");
  const ogDescription = String(formData.get("ogDescription") ?? "");
  const ogImage = String(formData.get("ogImage") ?? "");
  
  const noindex = formData.get("noindex") === "on";
  const nofollow = formData.get("nofollow") === "on";

  // Parse customFields safely
  let customFields = {};
  const customFieldsRaw = formData.get("customFields");
  if (customFieldsRaw) {
    try {
      customFields = JSON.parse(String(customFieldsRaw));
    } catch {
      console.warn("Invalid customFields JSON");
    }
  }

  if (!originalSlug || !name || !slug) {
    return respondError(request, { error: "missing_fields", message: "Thiếu dữ liệu trang bắt buộc.", location: `${ROUTES.ADMIN.PAGES}/${originalSlug || slug}?error=missing_fields` });
  }

  try {
    const existing = await getPageBySlug(originalSlug);

    if (!existing) {
      return respondError(request, { error: "page_not_found", message: "Không tìm thấy trang.", location: `${ROUTES.ADMIN.PAGES}?error=page_not_found` });
    }

    const normalizedPermalink = normalizePagePermalinkInput(
      canCustomizePagePermalink(slug) ? permalink : existing.permalink,
      slug
    );

    if (isReservedPagePermalink(normalizedPermalink)) {
      return respondError(request, {
        error: "invalid_permalink",
        message: "Permalink đang trùng vùng route hệ thống. Hãy chọn đường dẫn khác.",
        location: `${ROUTES.ADMIN.PAGES}/${originalSlug}?error=invalid_permalink`,
      });
    }

    await updateManagedPage(originalSlug, {
      slug,
      name,
      title,
      excerpt,
      body,
      status,
      seoTitle,
      seoDescription,
      seoKeywords,
      canonicalUrl,
      permalink: normalizedPermalink,
      breadcrumbTitle,
      breadcrumbParentSlug: breadcrumbParentSlug || undefined,
      ogTitle,
      ogDescription,
      ogImage,
      noindex,
      nofollow,
      customFields,
    });

    return respondSuccess(request, { location: `${ROUTES.ADMIN.PAGES}/${slug}`, message: "Đã lưu thay đổi trang." });
  } catch (error) {
    console.error("Failed to update page:", error);
    const message =
      error instanceof Error && /managed_pages_permalink_idx|cms_pages_permalink_idx|duplicate key/i.test(error.message)
        ? "Permalink đang bị trùng với trang khác."
        : "Không thể lưu trang.";
    return respondError(request, { error: "update_failed", message, location: `${ROUTES.ADMIN.PAGES}/${originalSlug}?error=update_failed` });
  }
}
