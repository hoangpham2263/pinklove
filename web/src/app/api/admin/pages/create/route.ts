import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createCmsPage } from "@/lib/cms";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL(ROUTES.ADMIN.LOGIN, request.url), 303);
  }

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "");
  let slug = String(formData.get("slug") ?? "");

  if (!name) {
    return NextResponse.redirect(new URL(`${ROUTES.ADMIN.DASHBOARD}/pages?error=missing_name`, request.url), 303);
  }

  // Normalize slug if missing or dirty
  if (!slug) {
    slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  try {
    await createCmsPage({
      name,
      slug,
      status: "draft",
      template: "default",
    });

    return NextResponse.redirect(new URL(`/admin/pages/${slug}`, request.url), 303);
  } catch (error) {
    console.error("Failed to create page:", error);
    return NextResponse.redirect(new URL(`/admin/pages?error=creation_failed`, request.url), 303);
  }
}