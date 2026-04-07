import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { updateCmsPage, getCmsPageBySlug } from "@/lib/cms";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return new NextResponse(null, { status: 303, headers: { Location: ROUTES.ADMIN.LOGIN } });
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
    return new NextResponse(null, { status: 303, headers: { Location: `/admin/pages/${originalSlug || slug}?error=missing_fields` } });
  }

  try {
    const existing = await getCmsPageBySlug(originalSlug);

    if (!existing) {
      return new NextResponse(null, { status: 303, headers: { Location: "/admin/pages?error=page_not_found" } });
    }

    await updateCmsPage(originalSlug, {
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
      ogTitle,
      ogDescription,
      ogImage,
      noindex,
      nofollow,
      customFields,
    });

    return new NextResponse(null, { status: 303, headers: { Location: `/admin/pages/${slug}?saved=1` } });
  } catch (error) {
    console.error("Failed to update page:", error);
    return new NextResponse(null, { status: 303, headers: { Location: `/admin/pages/${originalSlug}?error=update_failed` } });
  }
}
