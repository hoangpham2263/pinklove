import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { updateCmsPage, createCmsPage, getCmsPageBySlug } from "@/lib/cms";
import { ROUTES } from "@/lib/routes";
import { SYSTEM_PAGES } from "@/features/client/templates";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL(ROUTES.ADMIN.LOGIN, request.url), 303);
  }

  const formData = await request.formData();
  const originalSlug = String(formData.get("originalSlug") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const name = String(formData.get("name") ?? "");
  const title = String(formData.get("title") ?? "");
  const excerpt = String(formData.get("excerpt") ?? "");
  const body = String(formData.get("body") ?? "");
  const status = String(formData.get("status") ?? "draft");
  const template = String(formData.get("template") ?? "default");
  
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
    } catch (e) {
      console.warn("Invalid customFields JSON");
    }
  }

  if (!originalSlug || !name || !slug) {
    return NextResponse.redirect(new URL(`/admin/pages/${originalSlug || slug}?error=missing_fields`, request.url), 303);
  }

  try {
    const existing = await getCmsPageBySlug(originalSlug);

    if (!existing) {
      if (SYSTEM_PAGES[originalSlug]) {
        await createCmsPage({
          slug,
          name,
          title,
          excerpt,
          body,
          status,
          template,
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
      } else {
        return NextResponse.redirect(new URL(`/admin/pages?error=page_not_found`, request.url), 303);
      }
    } else {
      await updateCmsPage(originalSlug, {
        slug,
        name,
        title,
        excerpt,
        body,
        status,
        template,
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
    }

    return NextResponse.redirect(new URL(`/admin/pages/${slug}?saved=1`, request.url), 303);
  } catch (error) {
    console.error("Failed to update page:", error);
    return NextResponse.redirect(new URL(`/admin/pages/${originalSlug}?error=update_failed`, request.url), 303);
  }
}
