import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteCmsPage } from "@/lib/cms";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL(ROUTES.ADMIN.LOGIN, request.url), 303);
  }

  const formData = await request.formData();
  const slug = String(formData.get("slug") ?? "");

  if (!slug) {
    return NextResponse.redirect(new URL(`${ROUTES.ADMIN.DASHBOARD}/pages?error=missing_slug`, request.url), 303);
  }

  // Prevent deleting protected pages
  if (["login", "register", "home"].includes(slug)) {
    return NextResponse.redirect(new URL(`${ROUTES.ADMIN.DASHBOARD}/pages?error=cannot_delete_protected_page`, request.url), 303);
  }

  try {
    const deleted = await deleteCmsPage(slug);
    if (!deleted) {
      return NextResponse.redirect(new URL(`${ROUTES.ADMIN.DASHBOARD}/pages?error=page_not_found`, request.url), 303);
    }

    return NextResponse.redirect(new URL(`/admin/pages?saved=deleted`, request.url), 303);
  } catch (error) {
    console.error("Failed to delete page:", error);
    return NextResponse.redirect(new URL(`/admin/pages?error=delete_failed`, request.url), 303);
  }
}
