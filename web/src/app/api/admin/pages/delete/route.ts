import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteCmsPage } from "@/lib/cms";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return new NextResponse(null, { status: 303, headers: { Location: ROUTES.ADMIN.LOGIN } });
  }

  const formData = await request.formData();
  const slug = String(formData.get("slug") ?? "");

  if (!slug) {
    return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.ADMIN.DASHBOARD}/pages?error=missing_slug` } });
  }

  // Prevent deleting protected pages
  if (["login", "register", "home"].includes(slug)) {
    return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.ADMIN.DASHBOARD}/pages?error=cannot_delete_protected_page` } });
  }

  try {
    const deleted = await deleteCmsPage(slug);
    if (!deleted) {
      return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.ADMIN.DASHBOARD}/pages?error=page_not_found` } });
    }

    return new NextResponse(null, { status: 303, headers: { Location: "/admin/pages?saved=deleted" } });
  } catch (error) {
    console.error("Failed to delete page:", error);
    return new NextResponse(null, { status: 303, headers: { Location: "/admin/pages?error=delete_failed" } });
  }
}
